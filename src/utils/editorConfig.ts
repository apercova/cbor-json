import { json } from '@codemirror/lang-json';
import { keymap, EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { selectAll } from '@codemirror/commands';
import { foldGutter } from '@codemirror/language';

// Shared editor configuration
export const clearEditorSelection = (view: EditorView) => {
  view.dispatch({ selection: { anchor: view.state.selection.main.head } });
  return true;
};

export const createEditorKeymap = () => keymap.of([
  {
    key: 'Mod-a',
    preventDefault: true,
    run: selectAll,
  },
  {
    key: 'Escape',
    preventDefault: true,
    run: clearEditorSelection,
  },
]);

export const createEditorExtensions = (isLargeFile: boolean) => {
  const extensions = [json(), createEditorKeymap(), foldGutter()];
  
  // For large files, add read-only mode
  if (isLargeFile) {
    extensions.push(
      EditorState.readOnly.of(true),
      EditorView.theme({
        '&': { cursor: 'text' },
        '.cm-content': { caretColor: 'transparent' }
      })
    );
  }
  
  return extensions;
};

export const editorBasicSetup = {
  lineNumbers: true,
  highlightActiveLineGutter: false,
  highlightActiveLine: false,
  foldGutter: false, // We handle this via extensions to avoid duplication
  dropCursor: false,
  allowMultipleSelections: true,
  indentOnInput: false,
  bracketMatching: true,
  closeBrackets: false,
  autocompletion: false,
  highlightSelectionMatches: false,
  searchKeymap: false,
};
