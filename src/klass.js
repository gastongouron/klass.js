(function() {

  var emptyFunction = function(){};

  // Helper Methods
  function _extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }

  function cloneWithInheritance(source){
    emptyFunction.prototype = source;
    return new emptyFunction();
  };

  function inheritorOf(parent,child){
    if (typeof parent !== 'function'){
      emptyFunction.prototype = parent;
      parent = emptyFunction;
    }
    return (child instanceof parent);
  };

  function toArray(iterable) {
    if (!iterable) return [];
    if ('toArray' in Object(iterable)) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  }

  function isKlass(object){
    return inheritorOf(Klass, object);
  }

  function isKlassInstance(object){
    return (isKlass(object.klass) && inheritorOf(object.klass.prototype, object));
  }

  function getFunctionArgumentNames(method) {
    var names = method.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  }






  // Klass ->

  // methods shared by both Klass and Klass.prototype
  klass.object = {
    extend: function extend(object){ return _extend(this, object); },
    aliasMethod: function aliasMethod(alias_method_name, method_name){
      var _method = this[method_name];
      var alias = function(){ return _method.apply(this, arguments); };
      alias.method_name = method_name;
      this[alias_method_name] = alias;
      return this;
    }
  };

  window.Klass = cloneWithInheritance(klass.object);
  _extend(window.Klass, {
    klass: Klass,
    klass_name: 'Klass',
    toString: function toObject(){ return "[object "+(this.klass_name||'AnonymousKlass')+"]"; },
    valueOf: function valueOf(){ return this; },
    subklasses: [],
    include: function include(object){ _extend(this.prototype, object); return this; }
  });

  Klass.prototype = cloneWithInheritance(klass.object);
  _extend(Klass.prototype, {
    klass: Klass,
    toString: function toObject(){
      return this.klass.prototype === this ?
        Object.prototype.toString(this):
        "[object "+this.klass.klass_name+":instance]";
    },
    valueOf: function valueOf(){ return this; },
    extend: function extend(object){ return _extend(this, object); }
  });

  function klassInstance(){
    if ('initialize' in this) return this.initialize.apply(this,arguments);
  };

  function createKlassInstance(){
    klassInstance.prototype = this.prototype;
    return new klassInstance;
  };

  function findKlassNameInDefinitions(definitions){
    for (var i=0; i < definitions.length; i++) {
      if (typeof definitions[i] === 'function')
        var klass_name = getFunctionArgumentNames(definitions[i])[0];
      if (typeof definitions[i] === 'string' && definitions[i].length)
        var klass_name = definitions[i];
      if (klass_name) return klass_name;
    };
  }

  function createKlass(superklass){
    if (this === Klass)
    var defs = toArray(arguments);
    var superklass = isKlass(defs[0]) ? defs.shift() : Klass;
    var _klass = cloneWithInheritance(superklass);
    _klass.superklass = superklass;
    _klass.klass_name = findKlassNameInDefinitions(defs);
    superklass.subklasses.push(_klass);
    _klass.subklasses = [];
    _klass.prototype = cloneWithInheritance(superklass.prototype);
    _klass.prototype.klass = _klass;
    defs.unshift(_klass);
    klass.apply(window,defs);
    return _klass;
  };

  Klass.create = function create(){
    return (this === Klass) ? createKlass.apply(this, arguments) : createKlassInstance.apply(this, arguments);
  };

  // klass sudo operator
  window.klass = function klass(_klass){
    if (!isKlass(_klass)) throw new Error('expected instance of Klass');
    var definitions = Array.prototype.slice.apply(arguments, [1]);
    for (var i=0; i < definitions.length; i++) {
      var definition = definitions[i];
      if (typeof definition === 'function') definition = definition.apply(_klass, [_klass, _klass.prototype]) || {};
      if (typeof definition === 'object') _extend(_klass.prototype, definition);
    };
  };

  function super_not_found_error(error){
    error.message = "super: no superclass method";
    error.name = "NoSuperError";
    return error;
  }

  Function.prototype.getSuper = function getSuper(context){
    var klass_context = isKlass(context) ? true :
                       isKlassInstance(context) ? false : null;
    if (klass_context === null) throw new Error('cannot call super outside of a klass context');

    var method = this, klass = klass_context ? context : context.klass;

    // method.method_name is used to cast a method's name, this is used for things like aliasing
    // to maintian the super tree
    var method_name = method.method_name || (function() {
      for (key in context) if (context[key] === method) return key;
    })();
    if (!method_name) return false;

    var super_method = klass_context ? klass.superklass[method_name] : klass.superklass.prototype[method_name];
    if (!super_method || typeof super_method !== 'function') return false;
    return super_method;
  };

  // function(){
  //   return arguments.callee.$super(this, arguments);
  // }
  Function.prototype.$super = function $super(context, args){
    if (args && Object.prototype.toString.apply(args) !== "[object Array]")
      throw new TypeError('second argument to Function.prototype.$super must be an array');
    var super_method = this.getSuper(context);
    if (!super_method) throw super_not_found_error(new Error());
    return super_method.apply(context,args);
  };


})();