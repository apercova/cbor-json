const { clearEditorSelection } = require('./editorConfig');

jest.mock('@codemirror/lang-json', () => ({ json: jest.fn() }));
jest.mock('@codemirror/view', () => ({
  keymap: { of: jest.fn() },
  EditorView: { theme: jest.fn() },
}));
jest.mock('@codemirror/state', () => ({ EditorState: { readOnly: { of: jest.fn() } } }));
jest.mock('@codemirror/commands', () => ({ selectAll: jest.fn() }));
jest.mock('@codemirror/language', () => ({ foldGutter: jest.fn() }));

it('collapses the editor selection at its head when Escape is pressed', () => {
  const view = {
    state: { selection: { main: { head: 7 } } },
    dispatch: jest.fn(),
  };

  expect(clearEditorSelection(view)).toBe(true);
  expect(view.dispatch).toHaveBeenCalledWith({ selection: { anchor: 7 } });
});
