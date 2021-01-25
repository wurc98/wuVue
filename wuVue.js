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
        Object.defineProperty(obj, key, {
            get: () => {
                console.log("get value", key, value)
                return value;
            },
            set: (newVal) => {
                if (value == newVal) return;
                //当newVal为对象时。
                this.observer(newVal)
                console.log("set value", key, value)
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
    }
    Compiler(fragment) {
        //类数组转化为数组
        const childNodes = Array.from(fragment.childNodes);
        childNodes.forEach(childNode => {
            console.log(childNode.nodeType)
            if (this.isElementNode(childNode)) {
                //标签节点h1/input 读取属性，查看是否有v-开头的属性
                console.log("标签节点", childNode)
                this.compileElement(childNode)
            } else if (this.isTextNode(childNode)) {
                //内容节点是否有{{}}
                console.log('文本节点 :>> ', childNode);
                this.compileText(childNode)
            }
            //遍历子节点
            if (childNode.childNodes && childNode.childNodes.length) {
                this.Compiler(childNode)
            }
        })
    }
    compileElement(node){
        
    }
    compileText(node){
        const content = node.textContent;
        if(/\{\{(.+)\}\}/.test(content)){
            console.log("存在{{}}")
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
        console.dir(f)
        return f
    }
}
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