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

    /**
     * No-effect placeholder function.
     */
    const NO_OP = () => { };

    /**
     * Takes a `test` result or predicate function without args and throws
     * error with given `msg` if test failed (i.e. is falsy).
     *
     * @remarks
     * The function is only enabled if `process.env.NODE_ENV != "production"`
     * or if the `UMBRELLA_ASSERTS` env var is set to 1.
     */
    const assert = (() => {
        try {
            return (process.env.NODE_ENV !== "production" ||
                process.env.UMBRELLA_ASSERTS === "1");
        }
        catch (e) { }
        return false;
    })()
        ? (test, msg = "assertion failed") => {
            if ((typeof test === "function" && !test()) || !test) {
                throw new Error(typeof msg === "function" ? msg() : msg);
            }
        }
        : NO_OP;

    /**
     * Returns first element of given array or `undefined` if array is empty.
     *
     * @param buf - array
     */
    /**
     * Returns last element of given array or `undefined` if array is empty.
     *
     * @param buf - array
     */
    const peek = (buf) => buf[buf.length - 1];

    const newPath = (l, r, path, nodes, changed = false) => ({
        l,
        r,
        path,
        nodes,
        changed,
    });
    const changedPath = (path) => path ? Object.assign(Object.assign({}, path), { changed: true }) : undefined;
    class Location {
        constructor(node, ops, path) {
            this._node = node;
            this._ops = ops;
            this._path = path;
        }
        get isBranch() {
            return this._ops.branch(this._node);
        }
        get isFirst() {
            return !this.lefts;
        }
        get isLast() {
            return !this.rights;
        }
        get depth() {
            let d = 0;
            let path = this._path;
            while (path) {
                d++;
                path = path.path;
            }
            return d;
        }
        get node() {
            return this._node;
        }
        get children() {
            return this._ops.children(this._node);
        }
        get path() {
            return this._path ? this._path.nodes : undefined;
        }
        get lefts() {
            return this._path ? this._path.l : undefined;
        }
        get rights() {
            return this._path ? this._path.r : undefined;
        }
        get left() {
            const path = this._path;
            const lefts = path && path.l;
            return lefts && lefts.length
                ? new Location(peek(lefts), this._ops, newPath(lefts.slice(0, lefts.length - 1), [this._node].concat(path.r || []), path.path, path.nodes, path.changed))
                : undefined;
        }
        get right() {
            const path = this._path;
            const rights = path && path.r;
            if (!rights)
                return;
            const r = rights.slice(1);
            return new Location(rights[0], this._ops, newPath((path.l || []).concat([this._node]), r.length ? r : undefined, path.path, path.nodes, path.changed));
        }
        get leftmost() {
            const path = this._path;
            const lefts = path && path.l;
            return lefts && lefts.length
                ? new Location(lefts[0], this._ops, newPath(undefined, lefts.slice(1).concat([this._node], path.r || []), path.path, path.nodes, path.changed))
                : this;
        }
        get rightmost() {
            const path = this._path;
            const rights = path && path.r;
            return rights
                ? new Location(peek(rights), this._ops, newPath((path.l || []).concat([this._node], rights.slice(0, rights.length - 1)), undefined, path.path, path.nodes, path.changed))
                : this;
        }
        get down() {
            if (!this.isBranch)
                return;
            const children = this.children;
            if (!children)
                return;
            const path = this._path;
            const r = children.slice(1);
            return new Location(children[0], this._ops, newPath(undefined, r.length ? r : undefined, path, path ? path.nodes.concat([this._node]) : [this._node]));
        }
        get up() {
            let path = this._path;
            const pnodes = path && path.nodes;
            if (!pnodes)
                return;
            const pnode = peek(pnodes);
            if (path.changed) {
                return new Location(this.newNode(pnode, (path.l || []).concat([this._node], path.r || [])), this._ops, changedPath(path.path));
            }
            else {
                return new Location(pnode, this._ops, path.path);
            }
        }
        get root() {
            const parent = this.up;
            return parent ? parent.root : this._node;
        }
        get prev() {
            let node = this.left;
            if (!node)
                return this.up;
            while (true) {
                const child = node.isBranch
                    ? node.down
                    : undefined;
                if (!child)
                    return node;
                node = child.rightmost;
            }
        }
        get next() {
            if (this.isBranch)
                return this.down;
            let right = this.right;
            if (right)
                return right;
            let loc = this;
            while (true) {
                const up = loc.up;
                if (!up)
                    return;
                right = up.right;
                if (right)
                    return right;
                loc = up;
            }
        }

        get nextSibling() {
            let right = this.right;
            if (right)
                return right;
            let loc = this;
            while (true) {
                const up = loc.up;
                if (!up)
                    return;
                right = up.right;
                if (right)
                    return right;
                loc = up;
            }
        }

        get prevSibling() {
            let node = this.left;
            if (!node)
                return this.up;
            return node;
        }


        replace(x) {
            return new Location(x, this._ops, changedPath(this._path));
        }
        update(fn, ...xs) {
            return this.replace(fn(this._node, ...xs));
        }
        insertLeft(x) {
            this.ensureNotRoot();
            const path = this._path;
            return new Location(this._node, this._ops, newPath(path.l ? path.l.concat([x]) : [x], path.r, path.path, path.nodes, true));
        }
        insertRight(x) {
            this.ensureNotRoot();
            const path = this._path;
            return new Location(this._node, this._ops, newPath(path.l, [x].concat(path.r || []), path.path, path.nodes, true));
        }
        insertChild(x) {
            this.ensureBranch();
            return this.replace(this.newNode(this._node, [x, ...this.children]));
        }
        appendChild(x) {
            this.ensureBranch();
            return this.replace(this.newNode(this._node, this.children.concat([x])));
        }
        remove() {
            this.ensureNotRoot();
            const path = this._path;
            const lefts = path.l;
            if (lefts ? lefts.length : 0) {
                let loc = new Location(peek(lefts), this._ops, newPath(lefts.slice(0, lefts.length - 1), path.r, path.path, path.nodes, true));
                while (true) {
                    const child = loc.isBranch ? loc.down : undefined;
                    if (!child)
                        return loc;
                    loc = child.rightmost;
                }
            }
            return new Location(this.newNode(peek(path.nodes), path.r || []), this._ops, changedPath(path.path));
        }
        newNode(node, children) {
            return this._ops.factory(node, children);
        }
        ensureNotRoot() {
            assert(!!this._path, "can't insert at root level");
        }
        ensureBranch() {
            assert(this.isBranch, "can only insert in branches");
        }
    }
    const zipper = (ops, node) => new Location(node, ops);



    CodeMirror.defineExtension("Zipper", function name(node) {
        return zipper({
            branch: item => item.children ? item.children.length != 0 : false,
            children: item => item.children,
            factory: (node, children) => { node.children = children; return children }
        }, node);
    });



});