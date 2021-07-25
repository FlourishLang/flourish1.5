
import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup"
import { javascript } from "@codemirror/lang-javascript"

export default function setupEditor(dom: Element) {

    let editor = new EditorView({
        state: EditorState.create({
            extensions: [basicSetup, javascript()]
        }),
        parent: dom
    })


}



