// TreeSitter-CodeMirror addon, copyright (c) by Shakthi Prasad GS and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {

    CodeMirror.defineOption("activeBlock", false, function (cm, val, old) {

        let activeLineMap = new WeakMap();

        if (!val) {
            cm.clearGutter("activeBlock");
            activeLineMap = null;
        } else {

            cm.on("gutterClick", function (cm, n, gutter) {
                if (gutter === "activeBlock")
                {
                       CodeMirror.signal(cm, "setActiveLine", n);
                }
            });

            function makeGutterActiveBlockLine(color) {
                var marker = document.createElement("div");
                
                if(color == "green"){
                    marker.className = "execLine"
                }
                else{
                    marker.className = "nonExecLine"
                }
                
                marker.innerHTML = "&nbsp&nbsp&nbsp&nbsp";
                return marker;
            }

            let firstRefresh = true;
      

            

            CodeMirror.defineExtension("showActiveBlock", function (startline, endLine) {

                let totalNumber = this.getDoc().lineCount();

                for (let index = 0; index < totalNumber; index++) {
                    let line = this.getDoc().getLineHandle(index);

                    let oldType = activeLineMap.get(line);

                    if (!(index >= startline && index < endLine)) {

                        // if (!line.gutterMarkers || !line.gutterMarkers.activeBlock)
                        // this.setGutterMarker(index, "activeBlock", makeGutterActiveBlockLine());

                        if (oldType != "cyan") {
                            this.setGutterMarker(index, "activeBlock", makeGutterActiveBlockLine('cyan'));
                            activeLineMap.set(line, "cyan");
                        }



                    } else {
                        if (oldType != "green") {
                            this.setGutterMarker(index, "activeBlock", makeGutterActiveBlockLine('green'));
                            activeLineMap.set(line, "green");
                        }

                    }

                }

            })





        }

    })

});