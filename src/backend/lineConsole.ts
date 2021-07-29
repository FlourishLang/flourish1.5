
export interface LineData {
  message: string,
  type: string
}


export default class LineConsole {

  private lines: { [name: string]: LineData } = {};

  constructor() {
    this.clear();
  }

  log(linecount: number, message: string) {
    this.lines[linecount] = { message: message, type: "result" };
  }

  logRange(lineBegin: number, lineEnd: number, data: LineData) {
    for (let index = lineBegin; index <= lineEnd; index++) {
      this.lines[index] = data;

    }
  }



  clear() {
    this.lines = {};
  }

  getData() {
    return this.lines;
  }
}


module.exports = LineConsole;