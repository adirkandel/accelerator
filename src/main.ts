// Import stylesheets
import './style.css';
import CSVToArray from './CSVToArray';
import { ColDef, Grid, GridApi } from 'ag-grid-community';
import SaveKeywordRenderer from './SaveKeywordRenderer';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { GridOptions } from "ag-grid-community/dist/lib/entities/gridOptions";
import { DataKeys, DataType } from "./types";
import RemoveKeywordRenderer from "./RemoveKeywordRenderer";

const colContexts: DataKeys[] = [DataKeys.KEYWORD, DataKeys.DIFFICULTY, DataKeys.VOLUME, DataKeys.PHRASE];

const serializeNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const updateStatusBar = (api: GridApi<DataType>, selector: string, total: number) => {
  const filtered = api.getModel().getRowCount();
  const statusBarElm = document.querySelector(selector) as HTMLDivElement;
  let totalDesc = `${serializeNumber(total)} rows`;
  if (filtered !== total) {
    totalDesc = `<span class="filtered">${serializeNumber(filtered)}</span> out of ${totalDesc}`;
  }
  statusBarElm.innerHTML = `Showing ${totalDesc}`;
  (statusBarElm.parentElement!.querySelector('.export-btn') as HTMLButtonElement).style.display = 'block'
}

// Write Javascript code!
async function csvToRows(file: File) {
  const text = await file.text();
  const rows = CSVToArray(text);

  const phrases = rows[0].filter((phrase) => !!phrase);

  // remove phrases and titles from the csv result
  rows.splice(0, 2);

  const data: DataType[] = [];

  let dataIdx = 0;
  rows.forEach((row) => {
    let phraseIdx = 0;
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const col = row[colIdx];
      const contextIdx = colIdx % 4;
      const context = colContexts[contextIdx];

      if (contextIdx === 0) {
        data[dataIdx] = {} as DataType;
      }

      if (contextIdx === 3) {
        data[dataIdx] = {
          ...data[dataIdx],
          [context]: phrases[phraseIdx]
        };
        dataIdx++;
        phraseIdx++;
      } else {
        const res = [DataKeys.DIFFICULTY, DataKeys.VOLUME].includes(context)
          ? col
            ? parseInt(col)
            : null
          : col
        data[dataIdx] = {
          ...data[dataIdx],
          [context]: res
        };
      }
    }
  });

  return data;
}

const gridOptions: GridOptions<DataType> = {
  ensureDomOrder: true,
  enableCellTextSelection: true,
  animateRows: true,
  defaultColDef: {
    wrapText: true,
    autoHeight: true,
    resizable: true,
    sortable: true,
    filter: true,
  },
  columnDefs: [
    {
      field: 'keyword',
      flex: 1,
      maxWidth: 400,
    },
    {
      field: 'difficulty',
      filter: 'agNumberColumnFilter',
      width: 120,
    },
    {
      field: 'volume',
      filter: 'agNumberColumnFilter',
      width: 120,
    },
    {
      field: 'phrase',
      flex: 1,
      maxWidth: 200,
    },
  ],
};

async function generateGrid(selector: string, options: GridOptions<DataType>): Promise<GridOptions<DataType>> {
  const eGridDiv = document.querySelector(selector);
  const gridOptionsCopy = {
    ...gridOptions,
    ...options,
  };
  new Grid(eGridDiv as HTMLElement, gridOptionsCopy);
  return gridOptionsCopy;
}

const fileInput = document.getElementById('file') as HTMLInputElement;
fileInput.addEventListener('change', async (event) => {
  const file = (event.currentTarget as HTMLInputElement).files?.item(0);
  if (!file) {
    return
  }

  let favsGridOptions: GridOptions<DataType>
  const FAVS_LOCAL_KEY = 'FAVS_LOCAL_KEY'
  const favsFromLocalStorage = localStorage.getItem(FAVS_LOCAL_KEY)
  let favsRowsData: DataType[] = favsFromLocalStorage ? JSON.parse(favsFromLocalStorage) : []
  let totalFavsRows = 0
  const onFavsRowUpdate = (data: DataType, action: 'save' | 'remove') => {
    const favsRowsCopy = [ ...favsRowsData ]
    const dataIndex = favsRowsCopy.findIndex(row => row.keyword === data.keyword && row.phrase === data.phrase)
    if (action === 'save') {
      dataIndex === -1 && favsRowsCopy.push(data)
    } else {
      if (dataIndex === -1) {
        return
      }
      favsRowsCopy.splice(dataIndex, 1)
    }
    favsRowsData = favsRowsCopy
    favsGridOptions.api!.setRowData(favsRowsData);
    totalFavsRows = favsRowsData.length
    updateStatusBar(favsGridOptions.api!, '.favs-grid-status', totalFavsRows)
    localStorage.setItem(FAVS_LOCAL_KEY, JSON.stringify(favsRowsData))
  }

  const rows = await csvToRows(file);
  let totalRows = 0;
  const initGridOptions = await generateGrid('#initial-grid', {
    onFirstDataRendered: (params) => {
      totalRows = params.api.getModel().getRowCount();
      updateStatusBar(params.api, '.initial-grid-status', totalRows);
    },
    onFilterChanged: ({api}) => updateStatusBar(api, '.initial-grid-status', totalRows),
    columnDefs: (() => {
      const columnDefsCopy = (gridOptions.columnDefs as ColDef<DataType>[]).slice();
      SaveKeywordRenderer.prototype.saveRowCallback = onFavsRowUpdate
      columnDefsCopy[0] = { ...columnDefsCopy[0], cellRenderer: SaveKeywordRenderer};
      return columnDefsCopy;
    })(),
  });
  initGridOptions?.api?.setRowData(rows);
  document.getElementById('export-initial')?.addEventListener('click', () => initGridOptions.api?.exportDataAsCsv())

  favsGridOptions = await generateGrid('#favs-grid', {
    rowData: favsRowsData,
    onFirstDataRendered: (params) => {
      totalFavsRows = params.api.getModel().getRowCount();
      updateStatusBar(params.api, '.favs-grid-status', totalFavsRows);
    },
    onFilterChanged: ({api}) => updateStatusBar(api, '.favs-grid-status', totalFavsRows),
    columnDefs: (() => {
      const columnDefsCopy = (gridOptions.columnDefs as ColDef<DataType>[]).slice();
      RemoveKeywordRenderer.prototype.removeRowCallback = onFavsRowUpdate
      columnDefsCopy[0] = { ...columnDefsCopy[0], cellRenderer: RemoveKeywordRenderer};
      return columnDefsCopy;
    })(),
  });
  document.getElementById('export-favs')?.addEventListener('click', () => favsGridOptions.api?.exportDataAsCsv())
});
