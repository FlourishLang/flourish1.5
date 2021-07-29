
function spliceSplit(str: string, index: number, count: number, add: string) {
  var ar = str.split('');
  ar.splice(index, count, add);
  return ar.join('');
}

interface codeMirrorPos {
  line: number;
  ch: number;
  sticky?: string;
  xRel?: number;
}

interface codeMirrorChange {
  from: codeMirrorPos;
  to: codeMirrorPos;
  removed: string[];
  text: string[];
  origin?: string;
}

export default class BackBuffer {


  constructor(private text: string) {

  }


  treeEditForEditorChange(change: codeMirrorChange, startIndex: number) {
    const oldLineCount = change.removed.length;
    const newLineCount = change.text.length;
    const lastLineLength = change.text[newLineCount - 1].length;

    const startPosition = { row: change.from.line, column: change.from.ch };
    const oldEndPosition = { row: change.to.line, column: change.to.ch };
    const newEndPosition = {
      row: startPosition.row + newLineCount - 1,
      column: newLineCount === 1
        ? startPosition.column + lastLineLength
        : lastLineLength
    };

    let newEndIndex = startIndex + newLineCount - 1;
    let oldEndIndex = startIndex + oldLineCount - 1;
    for (let i = 0; i < newLineCount; i++) newEndIndex += change.text[i].length;
    for (let i = 0; i < oldLineCount; i++) oldEndIndex += change.removed[i].length;

    return {
      startIndex, oldEndIndex, newEndIndex,
      startPosition, oldEndPosition, newEndPosition
    };
  }


  applyChanges(changes: codeMirrorChange) {
    let lines = this.text.split('\n');
    let firstLine = lines[changes.from.line];
    let lastLine = lines[changes.to.line];
    let firstLineFirstPart = firstLine.slice(0, changes.from.ch);
    let lastLineLastPart = lastLine.slice(changes.to.ch);

    let insertPart = changes.text.join('\n');

    let beforeFirstPartLines = lines.slice(0, changes.from.line);

    let afterLastPartLines = lines.slice(changes.to.line + 1);


    let centerPart = firstLineFirstPart + insertPart + lastLineLastPart;

    let finalLines = beforeFirstPartLines.concat(centerPart).concat(afterLastPartLines);
    let result = finalLines.join('\n');
    this.text = result;

    //TODO:Optimize this
    let beforeInsertionLines = beforeFirstPartLines.concat(firstLineFirstPart);
    let beforeInsertionPart = beforeInsertionLines.join('\n')
    let startIndex = beforeInsertionPart.length;

    let posInfo = this.treeEditForEditorChange(changes, startIndex);

    return { text: result, posInfo }
  }



}

