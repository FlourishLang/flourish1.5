import assert from 'assert';

import BackBuffer from '../src/backBuffer'



describe("builtIn", () => {
    it('should have fix bug in indented space', () => {
        let backBuffer = new BackBuffer(
`if = 3 3:
    set a 2
    set b 4
end
`);
        let { text } = backBuffer.applyChanges({
            "from": { "line": 1, "ch": 11, "sticky": "before", "xRel": 28.196029663085938 },
            "to": { "line": 1, "ch": 11, "sticky": "before", "xRel": 28.196029663085938 },
            "text": ["", ""], "removed": [""], "origin": "+input"
        })
        assert.strictEqual(text, 
`if = 3 3:
    set a 2

    set b 4
end
`);

    });

    it('should work for single charector additions', () => {
        let backBuffer = new BackBuffer(`12345`);
        let { text } = backBuffer.applyChanges({
            "from": { "line": 0, "ch": 3, "sticky": "before", "xRel": 28.196029663085938 },
            "to": { "line": 0, "ch": 3, "sticky": "before", "xRel": 28.196029663085938 },
            "text": ["x"], "removed": [""], "origin": "+input"
        })
        assert.strictEqual(text, '123x45');
    });

    it('should work for replacing single charector additions', () => {
        let backBuffer = new BackBuffer(`12345`);
        let { text } = backBuffer.applyChanges({
            "from": { "line": 0, "ch": 1, "sticky": "before", "xRel": 28.196029663085938 },
            "to": { "line": 0, "ch": 3, "sticky": "before", "xRel": 28.196029663085938 },
            "text": ["x"], "removed": ["23"], "origin": "+input"
        })
        assert.strictEqual(text, '1x45');
    });

    it('should work for interting newline ', () => {

        let backBuffer = new BackBuffer(`12345`);
        let { text } = backBuffer.applyChanges({
            "from": { "line": 0, "ch": 3, "sticky": "before", "xRel": 28.196029663085938 },
            "to": { "line": 0, "ch": 3, "sticky": "before", "xRel": 28.196029663085938 },
            "text": ["",""], "removed": [""], "origin": "+input"
        })
        assert.strictEqual(text, '123\n45');
    });





});