import './index.scss';

import './widgets/widget-badge.vue';
import './widgets/widget-button.vue';
import './widgets/widget-breadcrumb.vue';
import './widgets/widget-card.vue';

import './editors/editor-theme.vue';
import './editors/editor-switch.vue';
import './editors/editor-text.vue';
import './editors/editor-size.vue';
import './editors/editor-button.vue';

window.vm = new Vue({
    el: '.app',
    data() {
        return {
            vcmp: null
        }
    },
    methods: {
        showPpt: function(evt) {
            let elem = evt.target;
            if (!document.querySelector('.ppt').contains(elem)) {
                let vcmp = getVueCmp(this, elem);
                if (vcmp === this.$root) {
                    vcmp = null;
                }
                new Vue({
                    el: '.ppt',
                    template: '<div class="ppt">' + (vcmp ? vcmp.$options.editor || '' : '') + '</div>',
                    data() {
                        return getVueCmpData(vcmp, true);
                    },
                    created() {
                        this.$on('changeppt', function(name, value) {
                            if (vcmp) {
                                let names = name.split('.'),
                                    data = vcmp,
                                    len = names.length - 1;
                                for (let i = 0; i < len; i++) {
                                    data = data[names[i]];
                                }
                                data[names[len]] = value;
                            }
                        })
                        this.$on('click', function(handler) {
                            try {
                                (new Function(handler)).call(vcmp);
                            } catch (e) {
                                console.error('Ppt Handler Register Invalid.');
                            }
                        })
                    }
                })
            }
        }
    }
});

function getVueCmpData(vcmp) {
    if (!vcmp) return {};
    let $data = vcmp.$data,
        names = vcmp.$options._propKeys,
        data = {};
    if (names) {
        for (let k = 0, klen = names.length; k < klen; k++) {
            let name = names[k],
                vname = 'v' + name;
            data[name] = $data[vname];
        }
    } else if (arguments[1]) {
        let names = Object.getOwnPropertyNames($data);
        for (let i = 0, len = names.length; i < len; i++) {
            let name = names[i];
            data[name.substr(1)] = $data[name];
        }
    }
    return data;
}


function saveVue(vm, html, space) {
    html = html || [];
    space = (space || '\n') + '    ';
    if (vm.$options.save) {
        html.push(vm.$options.save(vm, space));
    } else {
        let $children = vm.$children;
        if ($children) {
            for (let i = 0, len = $children.length; i < len; i++) {
                let vcmp = $children[i],
                    tag = vcmp.$options.name,
                    $data = getVueCmpData(vcmp);
                html.push(space, '<', tag);
                for (let name in $data) {
                    if ($data[name]) {
                        html.push(' ', name, '="', $data[name], '"');
                    }
                }
                html.push('>');
                saveVue(vcmp, html, space);
                html.push(space, '</', tag, '>');
            }
        }
    }
    return html;
}

function getVueCmpByPelem(vm, pelems) {
    let $children = vm.$children;
    if ($children) {
        for (let i = 0, len = $children.length; i < len; i++) {
            let vcmp = $children[i],
                $el = vcmp.$el,
                idx = pelems.indexOf($el);
            if (idx !== -1) {
                pelems.length = idx;
                return getVueCmpByPelem(vcmp, pelems);
            }
        }
    }
    return vm;
}

function getVueCmp(vm, elem) {
    let pelems = [],
        $root = vm.$el;
    while (elem !== $root) {
        pelems.push(elem);
        elem = elem.parentNode;
    }
    return getVueCmpByPelem(vm, pelems);
}

window.saveVue = saveVue;
window.getVueCmp = getVueCmp;