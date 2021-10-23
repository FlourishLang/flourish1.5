// TreeSitter-CodeMirror addon, copyright (c) by Shakthi Prasad GS and others
// Distributed under an MIT license: https://codemirror.net/LICENSE


let CodeMirror = require('../../lib/codemirror')

function indentViaSpace(n) {
  let space = '  ';
  let spaceIndent = '';

  for (let index = 0; index < n; index++) {
    spaceIndent += space;
  }
  return spaceIndent;
}


function statementFormatter(tree) {



  function defaultFormatting(tree) {

    if (tree.children && tree.children.length)
      return tree.children.map(formatNode).join(' ');
    else return tree.leafText;

  }


  function formatNode(tree) {

    switch (tree.type) {
      case 'compoundExpression':
        return `[${formatNode(tree.children[1])}]`

      case 'inifixexpression':
        let children = tree.children.slice();
        children.shift();
        children.pop();
        return `(${children.map(formatNode).join(' ')})`

      //Should not have spaces between dots of attribute
      case 'attributelist':
        return tree.children.map(formatNode).join('');

      default:
        return defaultFormatting(tree);
    }

  }

  return indentViaSpace(tree.indentLevel - 1) + formatNode(tree);


}




function FormattedLineHelper(treeZipper, line) {

  function comparePos(pos1, pos2) {
    if (pos1.row != pos2.row)
      return pos1.row - pos2.row;

    return pos1.column - pos2.column;

  }

  CodeMirror.treeZipperInit(treeZipper);

  CodeMirror.treeZipperAdjustPositionExclusive({ row: line, column: 0 }, { row: line + 1, column: 0 });

  do {
    let tree = CodeMirror.treeZipperGetNode();
    if (!tree)
      break;
    let type = tree.type;


    if (tree.startPosition.row > line) {
      break;
    }
    if (tree.type == "emptylines" && tree.startPosition.row >= line && tree.startPosition.row <= line) {
      return indentViaSpace(tree.indentLevel - 1);
    }


    // if (tree.type == "emptylines" && tree.startPosition.row >= line && tree.endPosition.row <= line 

    if (tree.startPosition.row == line && tree.endPosition.row - 1 == line && tree.endPosition.column == 0
      && tree.type !== "block" && tree.type !== "emptylines") {
      return statementFormatter(tree);
    }

    CodeMirror.treeZipperMoveNext();


  } while (CodeMirror.treeZipperHasNext())

}

CodeMirror.registerHelper("format", "flourish", function (cm, start) {

  return FormattedLineHelper(cm.doc.getMode().treeSitterTreeZipper, start.line)


});


