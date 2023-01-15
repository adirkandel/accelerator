import { DataType } from "./types";
import {
  ICellRendererComp,
  ICellRendererParams
} from "ag-grid-community/dist/lib/rendering/cellRenderers/iCellRenderer";

export default class RemoveKeywordRenderer implements ICellRendererComp<DataType> {
  eButton?: HTMLElement
  eValue?: HTMLElement
  eGui = document.createElement('div')
  cellValue = ''
  removeRowCallback?: (data: DataType, action: 'remove') => void
  private eventListener = () => {}

  constructor() {
    // get references to the elements we want
    this.eventListener = () => alert(`${this.cellValue} medals won!`)
  }

  // gets called once before the renderer is used
  init(params: ICellRendererParams<DataType>) {
    // set value into cell
    this.cellValue = this.getValueToDisplay(params);

    // create the cell
    this.eGui.innerHTML = `
         <div class="flex items-center" style="column-gap: .25rem">
             <button class="btn-remove">🗑</button>
             <a target="_blank" href="https://google.com/search?q=${encodeURIComponent(this.cellValue)}" class="keyword">${this.cellValue}</span>
         </div>
      `;
    this.eButton = this.eGui.querySelector('.btn-remove')!;
    this.eValue = this.eGui.querySelector('.keyword')!;

    // add event listener to button
    this.eventListener = () => {
      RemoveKeywordRenderer.prototype.removeRowCallback && RemoveKeywordRenderer.prototype.removeRowCallback(params.data!, 'remove')
    };
    this.eButton.addEventListener('click', this.eventListener);
  }

  getGui() {
    return this.eGui;
  }

  // gets called whenever the cell refreshes
  refresh(params: ICellRendererParams<DataType>) {
    // set value into cell again
    this.cellValue = this.getValueToDisplay(params);
    if (this.eValue) {
      this.eValue.innerHTML = this.cellValue
    }

    // return true to tell the grid we refreshed successfully
    return true;
  }

  // gets called when the cell is removed from the grid
  destroy() {
    // do cleanup, remove event listener from button
    if (this.eButton) {
      // check that the button element exists as destroy() can be called before getGui()
      this.eButton.removeEventListener('click', this.eventListener);
    }
  }

  getValueToDisplay(params: ICellRendererParams<DataType>): string {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }
}