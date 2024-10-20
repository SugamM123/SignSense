
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Level1.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$2 } = globals;
    const file$3 = "src/Level1.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (59:4) {#each options as option}
    function create_each_block$2(ctx) {
    	let button;
    	let t_value = /*option*/ ctx[10] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*option*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-jtlr0g");
    			add_location(button, file$3, 59, 6, 1987);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*options*/ 2 && t_value !== (t_value = /*option*/ ctx[10] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(59:4) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let h1;
    	let t1;
    	let div1;
    	let div0;
    	let t2;
    	let p;
    	let t3;
    	let t4_value = Math.round(/*health*/ ctx[2] * 100) + "";
    	let t4;
    	let t5;
    	let t6;
    	let img;
    	let img_src_value;
    	let t7;
    	let div2;
    	let t8;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "ASL Numbers Learning";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t2 = space();
    			p = element("p");
    			t3 = text("Health: ");
    			t4 = text(t4_value);
    			t5 = text("%");
    			t6 = space();
    			img = element("img");
    			t7 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			button = element("button");
    			button.textContent = "Back to Lessons";
    			add_location(h1, file$3, 51, 2, 1686);
    			attr_dev(div0, "class", "" + (null_to_empty(/*getHealthColor*/ ctx[6]()) + " svelte-jtlr0g"));
    			set_style(div0, "width", /*health*/ ctx[2] * 100 + "%");
    			add_location(div0, file$3, 53, 4, 1747);
    			attr_dev(div1, "class", "health-bar svelte-jtlr0g");
    			add_location(div1, file$3, 52, 2, 1718);
    			add_location(p, file$3, 55, 2, 1826);
    			if (!src_url_equal(img.src, img_src_value = /*ASL_SIGNS*/ ctx[4][/*currentQuestion*/ ctx[0]])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "ASL sign");
    			attr_dev(img, "class", "svelte-jtlr0g");
    			add_location(img, file$3, 56, 2, 1871);
    			attr_dev(div2, "class", "options svelte-jtlr0g");
    			add_location(div2, file$3, 57, 2, 1929);
    			attr_dev(button, "class", "svelte-jtlr0g");
    			add_location(button, file$3, 62, 2, 2074);
    			attr_dev(div3, "class", "level1 svelte-jtlr0g");
    			add_location(div3, file$3, 50, 0, 1663);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h1);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div3, t2);
    			append_dev(div3, p);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(div3, t6);
    			append_dev(div3, img);
    			append_dev(div3, t7);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			append_dev(div3, t8);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[8], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*health*/ 4) {
    				set_style(div0, "width", /*health*/ ctx[2] * 100 + "%");
    			}

    			if (dirty & /*health*/ 4 && t4_value !== (t4_value = Math.round(/*health*/ ctx[2] * 100) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*currentQuestion*/ 1 && !src_url_equal(img.src, img_src_value = /*ASL_SIGNS*/ ctx[4][/*currentQuestion*/ ctx[0]])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*handleAnswer, options*/ 34) {
    				each_value = /*options*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Level1', slots, []);
    	const dispatch = createEventDispatcher();

    	const ASL_SIGNS = {
    		'1': 'https://asl-hands.s3.amazonaws.com/LSQ_1.jpg',
    		'2': 'https://asl-hands.s3.amazonaws.com/LSQ_2.jpg',
    		'3': 'https://asl-hands.s3.amazonaws.com/LSQ_3.jpg',
    		'4': 'https://asl-hands.s3.amazonaws.com/LSQ_4.jpg',
    		'5': 'https://asl-hands.s3.amazonaws.com/LSQ_5.jpg',
    		'6': 'https://asl-hands.s3.amazonaws.com/LSQ_6.jpg',
    		'7': 'https://asl-hands.s3.amazonaws.com/LSQ_7.jpg',
    		'8': 'https://asl-hands.s3.amazonaws.com/LSQ_8.jpg',
    		'9': 'https://asl-hands.s3.amazonaws.com/LSQ_9.jpg',
    		'10': 'https://asl-hands.s3.amazonaws.com/LSQ_10.jpg'
    	};

    	let currentQuestion = '';
    	let options = [];
    	let health = 1;

    	function newQuestion() {
    		const numbers = Object.keys(ASL_SIGNS);
    		$$invalidate(0, currentQuestion = numbers[Math.floor(Math.random() * numbers.length)]);
    		let wrongAnswers = numbers.filter(num => num !== currentQuestion);
    		wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
    		$$invalidate(1, options = [currentQuestion, ...wrongAnswers].sort(() => 0.5 - Math.random()));
    	}

    	function handleAnswer(selectedAnswer) {
    		if (selectedAnswer === currentQuestion) {
    			$$invalidate(2, health = Math.min(1, health + 0.1));
    			alert('Correct! Great job!');
    		} else {
    			$$invalidate(2, health = Math.max(0, health - 0.2));
    			alert(`Incorrect. The correct answer was ${currentQuestion}. Try again!`);
    		}

    		newQuestion();
    	}

    	function getHealthColor() {
    		if (health > 0.6) return 'bg-green-500';
    		if (health > 0.3) return 'bg-yellow-500';
    		return 'bg-red-500';
    	}

    	newQuestion();
    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Level1> was created with unknown prop '${key}'`);
    	});

    	const click_handler = option => handleAnswer(option);
    	const click_handler_1 = () => dispatch('back');

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		ASL_SIGNS,
    		currentQuestion,
    		options,
    		health,
    		newQuestion,
    		handleAnswer,
    		getHealthColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentQuestion' in $$props) $$invalidate(0, currentQuestion = $$props.currentQuestion);
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('health' in $$props) $$invalidate(2, health = $$props.health);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentQuestion,
    		options,
    		health,
    		dispatch,
    		ASL_SIGNS,
    		handleAnswer,
    		getHealthColor,
    		click_handler,
    		click_handler_1
    	];
    }

    class Level1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Level1",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Level2.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$1 } = globals;
    const file$2 = "src/Level2.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (75:4) {#each options as option}
    function create_each_block$1(ctx) {
    	let button;
    	let t_value = /*option*/ ctx[10] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*option*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-1q93b7v");
    			add_location(button, file$2, 75, 6, 3798);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*options*/ 2 && t_value !== (t_value = /*option*/ ctx[10] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(75:4) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let h1;
    	let t1;
    	let div1;
    	let div0;
    	let t2;
    	let p;
    	let t3;
    	let t4_value = Math.round(/*health*/ ctx[2] * 100) + "";
    	let t4;
    	let t5;
    	let t6;
    	let img;
    	let img_src_value;
    	let t7;
    	let div2;
    	let t8;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "ASL Alphabet Learning";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t2 = space();
    			p = element("p");
    			t3 = text("Health: ");
    			t4 = text(t4_value);
    			t5 = text("%");
    			t6 = space();
    			img = element("img");
    			t7 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			button = element("button");
    			button.textContent = "Back to Lessons";
    			add_location(h1, file$2, 67, 2, 3496);
    			attr_dev(div0, "class", "" + (null_to_empty(/*getHealthColor*/ ctx[6]()) + " svelte-1q93b7v"));
    			set_style(div0, "width", /*health*/ ctx[2] * 100 + "%");
    			add_location(div0, file$2, 69, 4, 3558);
    			attr_dev(div1, "class", "health-bar svelte-1q93b7v");
    			add_location(div1, file$2, 68, 2, 3529);
    			add_location(p, file$2, 71, 2, 3637);
    			if (!src_url_equal(img.src, img_src_value = /*ASL_SIGNS*/ ctx[4][/*currentQuestion*/ ctx[0]])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "ASL sign");
    			attr_dev(img, "class", "svelte-1q93b7v");
    			add_location(img, file$2, 72, 2, 3682);
    			attr_dev(div2, "class", "options svelte-1q93b7v");
    			add_location(div2, file$2, 73, 2, 3740);
    			attr_dev(button, "class", "svelte-1q93b7v");
    			add_location(button, file$2, 78, 2, 3885);
    			attr_dev(div3, "class", "level2 svelte-1q93b7v");
    			add_location(div3, file$2, 66, 0, 3473);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h1);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div3, t2);
    			append_dev(div3, p);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(div3, t6);
    			append_dev(div3, img);
    			append_dev(div3, t7);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			append_dev(div3, t8);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[8], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*health*/ 4) {
    				set_style(div0, "width", /*health*/ ctx[2] * 100 + "%");
    			}

    			if (dirty & /*health*/ 4 && t4_value !== (t4_value = Math.round(/*health*/ ctx[2] * 100) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*currentQuestion*/ 1 && !src_url_equal(img.src, img_src_value = /*ASL_SIGNS*/ ctx[4][/*currentQuestion*/ ctx[0]])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*handleAnswer, options*/ 34) {
    				each_value = /*options*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Level2', slots, []);
    	const dispatch = createEventDispatcher();

    	const ASL_SIGNS = {
    		'A': 'https://asl-hands.s3.amazonaws.com/gifs/A-Sign-Language-Alphabet.gif',
    		'B': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-B-in-Sign-Language-ASL.gif',
    		'C': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-say-letter-C-in-ASL-sign-Language.gif',
    		'D': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-D-in-Sign-Language-ASL.gif',
    		'E': 'https://asl-hands.s3.amazonaws.com/gifs/The-Letter-E-in-Sign-Language.gif',
    		'F': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-F-in-Sign-Language-ASL.gif',
    		'G': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-G-in-Sign-Language-ASL.gif',
    		'H': 'https://asl-hands.s3.amazonaws.com/gifs/H-in-Sign-Language-Alphabet.gif',
    		'I': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-I-in-Sign-Language-ASL.gif',
    		'J': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-J-in-ASL-Alphabets.gif',
    		'K': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-J-in-ASL-Alphabets.gif',
    		'L': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-L-in-ASL-Alphabets.gif',
    		'M': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-M-in-ASL-Alphabets.gif',
    		'N': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-N-in-ASL-Alphabets.gif',
    		'O': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-O-in-ASL-Alphabets.gif',
    		'P': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-P-in-ASL-Alphabets.gif',
    		'Q': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Q-in-ASL-Alphabets.gif',
    		'R': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-R-in-ASL-Alphabets.gif',
    		'S': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-S-in-ASL-Alphabets.gif',
    		'T': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-T-in-ASL-Alphabets.gif',
    		'U': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-U-in-ASL-Alphabets.gif',
    		'V': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-V-in-ASL-Alphabets.gif',
    		'W': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-W-in-ASL-Alphabets.gif',
    		'X': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-X-in-ASL-Alphabets.gif',
    		'Y': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Y-in-ASL-Alphabets.gif',
    		'Z': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Z-in-ASL-Alphabets.gif'
    	};

    	let currentQuestion = '';
    	let options = [];
    	let health = 1;

    	function newQuestion() {
    		const letters = Object.keys(ASL_SIGNS);
    		$$invalidate(0, currentQuestion = letters[Math.floor(Math.random() * letters.length)]);
    		let wrongAnswers = letters.filter(letter => letter !== currentQuestion);
    		wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
    		$$invalidate(1, options = [currentQuestion, ...wrongAnswers].sort(() => 0.5 - Math.random()));
    	}

    	function handleAnswer(selectedAnswer) {
    		if (selectedAnswer === currentQuestion) {
    			$$invalidate(2, health = Math.min(1, health + 0.1));
    			alert('Correct! Great job!');
    		} else {
    			$$invalidate(2, health = Math.max(0, health - 0.2));
    			alert(`Incorrect. The correct answer was ${currentQuestion}. Try again!`);
    		}

    		newQuestion();
    	}

    	function getHealthColor() {
    		if (health > 0.6) return 'bg-green-500';
    		if (health > 0.3) return 'bg-yellow-500';
    		return 'bg-red-500';
    	}

    	newQuestion();
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Level2> was created with unknown prop '${key}'`);
    	});

    	const click_handler = option => handleAnswer(option);
    	const click_handler_1 = () => dispatch('back');

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		ASL_SIGNS,
    		currentQuestion,
    		options,
    		health,
    		newQuestion,
    		handleAnswer,
    		getHealthColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentQuestion' in $$props) $$invalidate(0, currentQuestion = $$props.currentQuestion);
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('health' in $$props) $$invalidate(2, health = $$props.health);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentQuestion,
    		options,
    		health,
    		dispatch,
    		ASL_SIGNS,
    		handleAnswer,
    		getHealthColor,
    		click_handler,
    		click_handler_1
    	];
    }

    class Level2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Level2",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Level3.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$1 = "src/Level3.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (97:4) {#each options as option}
    function create_each_block(ctx) {
    	let button;
    	let t_value = /*option*/ ctx[15] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[9](/*option*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-dqqtkn");
    			add_location(button, file$1, 97, 6, 2913);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*options*/ 1 && t_value !== (t_value = /*option*/ ctx[15] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(97:4) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div3;
    	let h1;
    	let t1;
    	let div1;
    	let div0;
    	let t2;
    	let p0;
    	let t3;
    	let t4_value = Math.round(/*health*/ ctx[1] * 100) + "";
    	let t4;
    	let t5;
    	let t6;
    	let p1;
    	let t8;
    	let video;
    	let video_src_value;
    	let t9;
    	let button0;
    	let t11;
    	let div2;
    	let t12;
    	let button1;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "ASL Phrases Learning";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t2 = space();
    			p0 = element("p");
    			t3 = text("Health: ");
    			t4 = text(t4_value);
    			t5 = text("%");
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "What phrase is being signed?";
    			t8 = space();
    			video = element("video");
    			t9 = space();
    			button0 = element("button");
    			button0.textContent = "Replay Video";
    			t11 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Back to Lessons";
    			add_location(h1, file$1, 87, 2, 2449);
    			attr_dev(div0, "class", "" + (null_to_empty(/*getHealthColor*/ ctx[6]()) + " svelte-dqqtkn"));
    			set_style(div0, "width", /*health*/ ctx[1] * 100 + "%");
    			add_location(div0, file$1, 89, 4, 2510);
    			attr_dev(div1, "class", "health-bar svelte-dqqtkn");
    			add_location(div1, file$1, 88, 2, 2481);
    			add_location(p0, file$1, 91, 2, 2589);
    			add_location(p1, file$1, 92, 2, 2634);
    			if (!src_url_equal(video.src, video_src_value = /*currentVideoPath*/ ctx[2])) attr_dev(video, "src", video_src_value);
    			video.controls = true;
    			video.muted = true;
    			attr_dev(video, "width", "560");
    			attr_dev(video, "height", "315");
    			add_location(video, file$1, 93, 2, 2672);
    			attr_dev(button0, "class", "replay_button svelte-dqqtkn");
    			add_location(button0, file$1, 94, 2, 2778);
    			attr_dev(div2, "class", "options svelte-dqqtkn");
    			add_location(div2, file$1, 95, 2, 2855);
    			attr_dev(button1, "class", "svelte-dqqtkn");
    			add_location(button1, file$1, 100, 2, 3000);
    			attr_dev(div3, "class", "level3 svelte-dqqtkn");
    			add_location(div3, file$1, 86, 0, 2426);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h1);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div3, t2);
    			append_dev(div3, p0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(div3, t6);
    			append_dev(div3, p1);
    			append_dev(div3, t8);
    			append_dev(div3, video);
    			/*video_binding*/ ctx[8](video);
    			append_dev(div3, t9);
    			append_dev(div3, button0);
    			append_dev(div3, t11);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			append_dev(div3, t12);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*replayVideo*/ ctx[7], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*health*/ 2) {
    				set_style(div0, "width", /*health*/ ctx[1] * 100 + "%");
    			}

    			if (dirty & /*health*/ 2 && t4_value !== (t4_value = Math.round(/*health*/ ctx[1] * 100) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*currentVideoPath*/ 4 && !src_url_equal(video.src, video_src_value = /*currentVideoPath*/ ctx[2])) {
    				attr_dev(video, "src", video_src_value);
    			}

    			if (dirty & /*handleAnswer, options*/ 33) {
    				each_value = /*options*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*video_binding*/ ctx[8](null);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Level3', slots, []);
    	const dispatch = createEventDispatcher();
    	let currentQuestion = '';
    	let options = [];
    	let health = 1;
    	let currentVideoPath = '';
    	let videoElement;

    	const ASL_SIGNS = {
    		'Nice to meet you': 'Nicetomeetyou.mp4',
    		'And': 'And.mp4',
    		'Us': 'Us.mp4',
    		'Need': 'Need.mp4',
    		'Thank you': 'Thankyou.mp4',
    		'Good Morning': 'Goodmorning.mp4',
    		'School': 'School.mp4',
    		'Everyone': 'Everyone.mp4',
    		'Mom': 'Mom.mp4',
    		'Happy': 'Happy.mp4',
    		'I love you': 'Iloveyou.mp4',
    		'Understand': 'Understand.mp4',
    		'See you later': 'Seeyoulater.mp4',
    		'Dad': 'Dad.mp4',
    		'Good job': 'Goodjob.mp4',
    		"I don't like": "Idontlike.mp4",
    		'Chocolate': 'Chocolate.mp4',
    		'Come here please': 'Comehereplease.mp4',
    		'Allow': 'Allow.mp4',
    		'Food is good': 'Foodisgood.mp4',
    		'Pen?': 'Pen.mp4',
    		'Trick or Treat?': 'Trickortreat.mp4',
    		'I am sorry': 'Iamsorry.mp4',
    		'Where do you live?': 'Wheredoyoulive.mp4',
    		'Texas': 'Texas.mp4',
    		'I am deaf': 'Iamdeaf.mp4'
    	};

    	function newQuestion() {
    		const phrases = Object.keys(ASL_SIGNS);
    		currentQuestion = phrases[Math.floor(Math.random() * phrases.length)];
    		$$invalidate(2, currentVideoPath = `level3videos/${ASL_SIGNS[currentQuestion]}`);
    		console.log('Current video path:', currentVideoPath); // Log the path for debugging
    		let wrongAnswers = phrases.filter(phrase => phrase !== currentQuestion);
    		wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
    		$$invalidate(0, options = [currentQuestion, ...wrongAnswers].sort(() => 0.5 - Math.random()));
    		loadAndPlayVideo();
    	}

    	function loadAndPlayVideo() {
    		if (videoElement) {
    			videoElement.load();
    		}
    	}

    	function handleAnswer(selectedAnswer) {
    		if (selectedAnswer === currentQuestion) {
    			$$invalidate(1, health = Math.min(1, health + 0.1));
    			alert('Correct! Great job!');
    		} else {
    			$$invalidate(1, health = Math.max(0, health - 0.2));
    			alert(`Incorrect. The correct answer was "${currentQuestion}". Try again!`);
    		}

    		newQuestion();
    	}

    	function getHealthColor() {
    		if (health > 0.6) return 'bg-green-500';
    		if (health > 0.3) return 'bg-yellow-500';
    		return 'bg-red-500';
    	}

    	function replayVideo() {
    		if (videoElement) {
    			$$invalidate(3, videoElement.currentTime = 0, videoElement);
    			videoElement.play();
    		}
    	}

    	onMount(() => {
    		newQuestion();
    	});

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Level3> was created with unknown prop '${key}'`);
    	});

    	function video_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			videoElement = $$value;
    			$$invalidate(3, videoElement);
    		});
    	}

    	const click_handler = option => handleAnswer(option);
    	const click_handler_1 = () => dispatch('back');

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		dispatch,
    		currentQuestion,
    		options,
    		health,
    		currentVideoPath,
    		videoElement,
    		ASL_SIGNS,
    		newQuestion,
    		loadAndPlayVideo,
    		handleAnswer,
    		getHealthColor,
    		replayVideo
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentQuestion' in $$props) currentQuestion = $$props.currentQuestion;
    		if ('options' in $$props) $$invalidate(0, options = $$props.options);
    		if ('health' in $$props) $$invalidate(1, health = $$props.health);
    		if ('currentVideoPath' in $$props) $$invalidate(2, currentVideoPath = $$props.currentVideoPath);
    		if ('videoElement' in $$props) $$invalidate(3, videoElement = $$props.videoElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		options,
    		health,
    		currentVideoPath,
    		videoElement,
    		dispatch,
    		handleAnswer,
    		getHealthColor,
    		replayVideo,
    		video_binding,
    		click_handler,
    		click_handler_1
    	];
    }

    class Level3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Level3",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    // (79:38) 
    function create_if_block_4(ctx) {
    	let level3;
    	let current;
    	level3 = new Level3({ $$inline: true });
    	level3.$on("back", /*back_handler_2*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(level3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(level3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(level3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(level3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(level3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(79:38) ",
    		ctx
    	});

    	return block;
    }

    // (77:38) 
    function create_if_block_3(ctx) {
    	let level2;
    	let current;
    	level2 = new Level2({ $$inline: true });
    	level2.$on("back", /*back_handler_1*/ ctx[12]);

    	const block = {
    		c: function create() {
    			create_component(level2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(level2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(level2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(level2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(level2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(77:38) ",
    		ctx
    	});

    	return block;
    }

    // (75:38) 
    function create_if_block_2(ctx) {
    	let level1;
    	let current;
    	level1 = new Level1({ $$inline: true });
    	level1.$on("back", /*back_handler*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(level1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(level1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(level1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(level1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(level1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(75:38) ",
    		ctx
    	});

    	return block;
    }

    // (65:39) 
    function create_if_block_1(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let button0;
    	let t3;
    	let div0;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Choose a Level";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Home";
    			t3 = space();
    			div0 = element("div");
    			button1 = element("button");
    			button1.textContent = "Level 1: Numbers";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "Level 2: Alphabet";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "Level 3: Phrases";
    			add_location(h1, file, 66, 3, 1698);
    			attr_dev(button0, "class", "home-button svelte-1b6onrz");
    			add_location(button0, file, 67, 3, 1725);
    			attr_dev(button1, "class", "button svelte-1b6onrz");
    			add_location(button1, file, 69, 4, 1838);
    			attr_dev(button2, "class", "button svelte-1b6onrz");
    			add_location(button2, file, 70, 4, 1929);
    			attr_dev(button3, "class", "button svelte-1b6onrz");
    			add_location(button3, file, 71, 4, 2021);
    			attr_dev(div0, "class", "level-buttons svelte-1b6onrz");
    			add_location(div0, file, 68, 3, 1806);
    			attr_dev(div1, "class", "lessons svelte-1b6onrz");
    			add_location(div1, file, 65, 2, 1673);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, button0);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, button1);
    			append_dev(div0, t5);
    			append_dev(div0, button2);
    			append_dev(div0, t7);
    			append_dev(div0, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[7], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[8], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[9], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_4*/ ctx[10], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(65:39) ",
    		ctx
    	});

    	return block;
    }

    // (42:1) {#if currentScreen === 'home'}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let div4;
    	let h1;
    	let t2;
    	let div0;
    	let h20;
    	let t4;
    	let p0;
    	let t5;
    	let t6;
    	let t7;
    	let p1;
    	let t9;
    	let div3;
    	let h21;
    	let t11;
    	let div2;
    	let div1;
    	let t12;
    	let p2;
    	let t14;
    	let button;
    	let t16;
    	let footer;
    	let p3;
    	let t18;
    	let p4;
    	let t20;
    	let p5;
    	let t21;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Welcome back, Sarah!";
    			t2 = space();
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Today's Progress";
    			t4 = space();
    			p0 = element("p");
    			t5 = text(/*minutes*/ ctx[1]);
    			t6 = text(" minutes");
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "Time spent learning today";
    			t9 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Daily Goal";
    			t11 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "10 / 20 signs learned";
    			t14 = space();
    			button = element("button");
    			button.textContent = "Continue Learning";
    			t16 = space();
    			footer = element("footer");
    			p3 = element("p");
    			p3.textContent = "Developed by Tidal Hackathon Team";
    			t18 = space();
    			p4 = element("p");
    			p4.textContent = "Harsh Dave, Shlok Bhakta, Sugam Mishra, Mehul Jain";
    			t20 = space();
    			p5 = element("p");
    			t21 = text(/*todayDate*/ ctx[2]);
    			if (!src_url_equal(img.src, img_src_value = "tidal_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Tidal Logo");
    			attr_dev(img, "class", "app-logo svelte-1b6onrz");
    			add_location(img, file, 42, 2, 897);
    			add_location(h1, file, 44, 3, 984);
    			add_location(h20, file, 46, 4, 1054);
    			attr_dev(p0, "class", "large-text svelte-1b6onrz");
    			add_location(p0, file, 47, 4, 1084);
    			add_location(p1, file, 48, 4, 1132);
    			attr_dev(div0, "class", "card progress-card svelte-1b6onrz");
    			add_location(div0, file, 45, 3, 1017);
    			add_location(h21, file, 51, 4, 1211);
    			attr_dev(div1, "class", "progress svelte-1b6onrz");
    			set_style(div1, "width", "50%");
    			add_location(div1, file, 53, 5, 1267);
    			attr_dev(div2, "class", "progress-bar svelte-1b6onrz");
    			add_location(div2, file, 52, 4, 1235);
    			add_location(p2, file, 55, 4, 1331);
    			attr_dev(div3, "class", "card goal-card svelte-1b6onrz");
    			add_location(div3, file, 50, 3, 1178);
    			attr_dev(button, "class", "primary-btn svelte-1b6onrz");
    			add_location(button, file, 57, 3, 1373);
    			add_location(p3, file, 59, 4, 1483);
    			add_location(p4, file, 60, 4, 1528);
    			add_location(p5, file, 61, 4, 1590);
    			attr_dev(footer, "class", "svelte-1b6onrz");
    			add_location(footer, file, 58, 3, 1470);
    			attr_dev(div4, "class", "home svelte-1b6onrz");
    			add_location(div4, file, 43, 2, 962);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h1);
    			append_dev(div4, t2);
    			append_dev(div4, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t4);
    			append_dev(div0, p0);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(div0, t7);
    			append_dev(div0, p1);
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, h21);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div3, t12);
    			append_dev(div3, p2);
    			append_dev(div4, t14);
    			append_dev(div4, button);
    			append_dev(div4, t16);
    			append_dev(div4, footer);
    			append_dev(footer, p3);
    			append_dev(footer, t18);
    			append_dev(footer, p4);
    			append_dev(footer, t20);
    			append_dev(footer, p5);
    			append_dev(p5, t21);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*minutes*/ 2) set_data_dev(t5, /*minutes*/ ctx[1]);
    			if (dirty & /*todayDate*/ 4) set_data_dev(t21, /*todayDate*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(42:1) {#if currentScreen === 'home'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let button;
    	let t0_value = (/*isDarkMode*/ ctx[3] ? '☀️' : '🌙') + "";
    	let t0;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentScreen*/ ctx[0] === 'home') return 0;
    		if (/*currentScreen*/ ctx[0] === 'lessons') return 1;
    		if (/*currentScreen*/ ctx[0] === 'level1') return 2;
    		if (/*currentScreen*/ ctx[0] === 'level2') return 3;
    		if (/*currentScreen*/ ctx[0] === 'level3') return 4;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(button, "class", "theme-toggle svelte-1b6onrz");
    			add_location(button, file, 37, 1, 766);
    			attr_dev(main, "class", "svelte-1b6onrz");
    			toggle_class(main, "dark", /*isDarkMode*/ ctx[3]);
    			add_location(main, file, 36, 0, 734);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, button);
    			append_dev(button, t0);
    			append_dev(main, t1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleDarkMode*/ ctx[5], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*isDarkMode*/ 8) && t0_value !== (t0_value = (/*isDarkMode*/ ctx[3] ? '☀️' : '🌙') + "")) set_data_dev(t0, t0_value);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if (!current || dirty & /*isDarkMode*/ 8) {
    				toggle_class(main, "dark", /*isDarkMode*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let currentScreen = 'home';
    	let minutes = 0;
    	let todayDate = '';
    	let isDarkMode = true;

    	onMount(() => {
    		updateDate();
    		startTimer();
    	});

    	function updateDate() {
    		const date = new Date();

    		$$invalidate(2, todayDate = date.toLocaleDateString('en-US', {
    			weekday: 'long',
    			year: 'numeric',
    			month: 'long',
    			day: 'numeric'
    		}));
    	}

    	function startTimer() {
    		setInterval(
    			() => {
    				$$invalidate(1, minutes += 1);
    			},
    			60000
    		); // Update every minute
    	}

    	function navigateTo(screen) {
    		$$invalidate(0, currentScreen = screen);
    	}

    	function toggleDarkMode() {
    		$$invalidate(3, isDarkMode = !isDarkMode);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => navigateTo('lessons');
    	const click_handler_1 = () => navigateTo('home');
    	const click_handler_2 = () => navigateTo('level1');
    	const click_handler_3 = () => navigateTo('level2');
    	const click_handler_4 = () => navigateTo('level3');
    	const back_handler = () => navigateTo('lessons');
    	const back_handler_1 = () => navigateTo('lessons');
    	const back_handler_2 = () => navigateTo('lessons');

    	$$self.$capture_state = () => ({
    		onMount,
    		Level1,
    		Level2,
    		Level3,
    		currentScreen,
    		minutes,
    		todayDate,
    		isDarkMode,
    		updateDate,
    		startTimer,
    		navigateTo,
    		toggleDarkMode
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentScreen' in $$props) $$invalidate(0, currentScreen = $$props.currentScreen);
    		if ('minutes' in $$props) $$invalidate(1, minutes = $$props.minutes);
    		if ('todayDate' in $$props) $$invalidate(2, todayDate = $$props.todayDate);
    		if ('isDarkMode' in $$props) $$invalidate(3, isDarkMode = $$props.isDarkMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentScreen,
    		minutes,
    		todayDate,
    		isDarkMode,
    		navigateTo,
    		toggleDarkMode,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		back_handler,
    		back_handler_1,
    		back_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
