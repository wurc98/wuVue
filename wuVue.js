
//绑定处理
const utils = {
    getValue(expr, vm) {
        return vm.$data[expr.trim()]
    },
    setValue(expr, vm, newValue) {
        vm.$data[expr] = newValue
    },
    textUpdater(node,value){
        console.log('触发更新:>> ', value);
        node.textContent =  value;
    },
    //v-model
    model(node, key, vm) {
        const initValue = this.getValue(key, vm)
        node.addEventListener('input', (e) => {
            const newValue = e.target.value;
            this.setValue(key, vm, newValue)
        })
    },
    text(node, value, vm) {
        if (value.includes("{{")) {
            //{{}}
            res = value.replace(/\{\{(.+)\}\}/g, (...args) => {
                console.log('args :>> ', args);
                const expr = args[1]
                new Watcher(expr,vm,(newValue)=>{
                    this.textUpdater(node,newValue)
                })
                return this.getValue(expr, vm)
            })
        } else {
            //v-text
            res = this.getValue(value, vm)
        }
        console.log('res :>> ', res);
        this.textUpdater(node,res)
    },
    on(node, value, vm, eventName) {

    }
}
//更新DOM
class Watcher{
    constructor(expr,vm,cb){
        this.expr = expr;
        this.vm = vm;
        this.cb = cb;
        this.oldValue = this.getOldValue;
    }
    getOldValue(){
        //标记当前watcher实例
        Dependence.target = this; 
        const oldValue = utils.getValue(this.expr,this.vm)
        Dependence.target = null;
        return oldValue
    }
    update(){
        const newValue = utils.getValue(this.expr,this.vm);
        if(newValue !== this.oldValue){
            this.cb(newValue)
        }
    }
}
//依赖 将数据与watcher绑定
class Dependence{
    constructor(){
        this.collect = []
    }
    addWatcher(Watcher){
        this.collect.push(Watcher)
    }
    notify(){
        console.log("notify",this.collect)
        this.collect.forEach(w=>w.update())
    }
}

//观察者，处理数据上的getter setter
class Observer {
    constructor(data) {
        typeof data == 'function' ? data = data() : null;
        this.observer(data)


    }
    observer(data) {
        if (data && typeof data == 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key])
            })
        }
    }
    defineReactive(obj, key, value) {
        //递归处理value;
        this.observer(value)
        //value已经不是对象了
        const dep = new Dependence();
        Object.defineProperty(obj, key, {
            get: () => {
                const target = Dependence.target;
                console.log('target :>> ', target);
                target&&dep.addWatcher(target)
                console.log("get value", key, value)
                return value;
            },
            set: (newVal) => {
                if (value == newVal) return;
                //当newVal为对象时。
                this.observer(newVal)
                //更新
                dep.notify()
                console.log("set value", key, newVal)
                value = newVal;
            }
        })
    }
}
//模板
class Compiler {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm
        const fragment = this.complieFragment(this.el)
        this.Compiler(fragment)
        this.el.appendChild(fragment)
    }
    Compiler(fragment) {
        //类数组转化为数组
        const childNodes = Array.from(fragment.childNodes);
        childNodes.forEach(childNode => {
            if (this.isElementNode(childNode)) {
                //标签节点h1/input 读取属性，查看是否有v-开头的属性
                // console.log("标签节点", childNode)
                this.compileElement(childNode)
            } else if (this.isTextNode(childNode)) {
                //内容节点是否有{{}}
                // console.log('文本节点 :>> ', childNode);
                this.compileText(childNode)
            }
            //遍历子节点
            if (childNode.childNodes && childNode.childNodes.length) {
                this.Compiler(childNode)
            }
        })
    }
    //处理标签属性
    compileElement(node) {
        const attributes = Array.from(node.attributes)
        // console.log('attributes :>> ', attributes);
        attributes.forEach(attr => {
            const { name, value } = attr;
            // console.log('attr :>> ', name, value);
            if (this.isDirector(name)) { //判断是否为指令
                //将指令 v-model v-text v-bind v-on:click... 结构出来
                const [, directive] = name.split('-')
                const [compileKey, eventName] = directive.split(":")
                console.log(directive, value)
                utils[compileKey](node, value, this.vm, eventName)
            }

        })
    }
    isDirector(name) {
        return name.startsWith("v-")  //判断是否以v-开头
    }
    //处理文本
    compileText(node) {
        const content = node.textContent;
        if (/\{\{(.+)\}\}/.test(content)) {
            console.log(content)
            console.log('content :>> ', content);
            //转发到v-text处理
            utils["text"](node, content, this.vm)
        }
    }
    isElementNode(el) {
        return el.nodeType === 1;
    }
    isTextNode(el) {
        return el.nodeType === 3;
    }
    complieFragment(el) {
        const f = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }
}

//主体类
class wuVue {
    constructor(options) {
        this.$el = options.el;
        typeof options.data == 'function' ? options.data = options.data() : null;
        this.$data = options.data;
        this.$options = options;

        // 创建观察者
        new Observer(this.$data);
        //处理模板部分，将模板中使用
        new Compiler(this.$el, this);

        this.proxData(this.$data)
    }
    //做转发， 将$data上的数据转发到实例对象上。
    proxData(data) {

        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                //获取数据
                get() {
                    return data[key]
                },
                //更改数据，直接通过 '实例对象.xx' 更改 '实例对象.$data.xx' 的数据
                set(newVal) {
                    data[key] = newVal
                }
            })
        })
    }
}