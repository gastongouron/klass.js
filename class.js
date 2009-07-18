Object.extend = function extend(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
};

Function.prototype.argumentNames = function argumentNames() {
  var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
    .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
    .replace(/\s+/g, '').split(',');
  return names.length == 1 && !names[0] ? [] : names;
};

Function.prototype.title = function(){
  return (this.name != "") ?
    this.name :
    this.toString().match(/^[\s\(]*function\s+([^(]*)\(/)[1];
};

// Object.define.apply(yourObject, property, [property])
Object.define = function defineMethod(properties){
  if (this == Object) throw new Error('Usage: Object.define.apply(...)');
  
  for (var i = arguments.length - 1; i >= 0; i--){
    var property = arguments[i];
    console.log(typeof property)
    if (typeof property == 'function'){
      var title = property.title();
      if (!title) throw new Error("function with name required. recieved:\n"+property.toString());
      this[title] = property;
    }else if (typeof property == 'object'){
      Object.extend(this,property);
    }else if (property instanceof Array){
      Object.define.apply(this,property);
    }
  };
};


(function() {
  
  this.Class = function Class(className, methods){
    // preventing unauthorized usage
    if (this instanceof Class) throw new TypeError('Class is not a constructor');
    if (this != window && (typeof this != 'function' || typeof this.className == 'undefined')) throw new Error('Class can only be applied to classes or window');

    console.log(arguments);

    var block;
    if (typeof className == 'function')
      block = className, className = block.argumentNames()[0];

    if (className[0] != className[0].toUpperCase()) throw new Error('class names must be capitalized');
    if (className.indexOf('_') != -1) throw new Error('class names may not have a _');
    var fullClassName = (this == window) ? className : (typeof this.className != 'undefined') ? this.className+'__'+className : false;

    console.info('Creating class ',fullClassName);

    eval('this[className] = function '+fullClassName+'(){ if (this.initialize) return this.initialize.apply(this, arguments); };');
    var klass = this[className];
    klass.className = fullClassName;
    klass.Class = window.Class;

    if (block)
      block(new ClassDefiner(klass));
  }
  
  function ClassDefiner(klass){
    this.klass = klass;
    this.Class = function(){ Class.apply(klass,arguments); };
    // this.self == //something fooful =P
  }
  ClassDefiner.prototype.def = function def(method){
    for (var i = arguments.length - 1; i >= 0; i--){
      var method = arguments[i];
      // if (method != 'private' || method != 'public'); TODO when private/public is built
      var title = method.title();
      if (!title) throw new Error("function without title passed to def\n"+method.toString());
      Object.define.apply(this.klass.prototype,[method]);
    };

  }
  ClassDefiner.prototype.define_method = ClassDefiner.prototype.define_methods = ClassDefiner.prototype.def;
  
})();





Class(function(Rupture){
  Rupture.define_methods(
    function alpheBear(){},
    function mamaDuck(){}
  )
  function createFrogClass(){
    Class('Fro')
  }
  var love = 5;
  with(Rupture){
    Class('Donkey',{a:def});
    var ass = 3;
    def(createFrogClass);
    // self.def(function thisIsAClassMehod(){});
  }
  
  this.defineMethods(
    function alpheBear(){},
    function mamaDuck(){}
  );
  
  with(this){
    def()
  }
  
});

console.dir(Rupture);

function Module(){
  Object.define.apply(this,arguments);
};

new Module(
  {someMethod: function(){}},
  function someOtherMethod(){},
  {version:2.4}  
);



