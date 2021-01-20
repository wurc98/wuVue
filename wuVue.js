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

class wuVue {
    constructor(options) {
        this.$el = options.el;
        typeof options.data == 'function' ? options.data = options.data() : null;
        this.$data = options.data;
        this.$options = options;
        // 创建观察者
        new Observer(this.$data)
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