#Klass.js

Klass.js is a more feature rich implementation of Ruby like Class inheritance in Javascript. The main advantage that Klass.js has over Prototype's Ruby like Class implementation is both Class and Instance based inheritance.

## Example

    var Car = Klass.create('Car');
    
    Car.prototype.initialize = function(color, size){
      this.color = color;
      this.size = size;
    };
    
    Car.prototype.getSize = function(){ return this.size; };
    Car.prototype.getColor = function(){ return this.color; };
    
    Truck = Klass.create(Car, 'Truck');
    
    Truck.prototype.initialize = function(color){
      arguments.callee.callSuper(this, color, 'huge');
    };
    
    
    var blue_truck = Truck.create('blue');
    blue_truck.getSize();
    //-> 'huge'
    blue_truck.getColor();
    //-> 'blue'
    
    // adding an instance method that uses klass names
    Car.prototype.describe = function(){
      return 'a '+this.size+' '+this.color+' '+this.klass.klass_name;
    }
    
    blue_truck.describe();
    //-> 'a huge blue Truck'
    
    
    // Adding a class method to Truck's Parent
    Car.createRed = function(size){
      return this.create('red', size);
    };
    
    var red_truck = Truck.createRed();
    red_truck.getColor();
    //-> 'red'
    red_truck.getSize();
    //-> 'huge'
    
    
    // the above example could also be writen like this
    
    var Car = Klass.create(function(Car){

      Car.createRed = function(size){
        return this.create('red', size);
      };
      
      function initialize(color, size){
        this.color = color;
        this.size = size;
      };
      
      function getSize(){ return this.size; };
      
      function getColor(){ return this.color; };
      
      return {
        initialize: initialize,
        getSize:    getSize,
        getColor:   getColor
      }
    });
    
    var Truck = Klass.create(Car, function(Truck){
      this.initialize = function(color){
        arguments.callee.callSuper(this, color, 'huge');
      };
    });
    
    

## Klass.js vs. Prototype
  Klass.js supports a syntax very similar to Prototype's Class. Compare the following code to the exmaples given in the Prototype documentation:
  <http://api.prototypejs.org/language/class.html#addmethods-instance_method>

    var Animal = Klass.create({
      initialize: function(name, sound) {
        this.name  = name;
        this.sound = sound;
      },

      speak: function() {
        alert(this.name + " says: " + this.sound + "!");
      }
    });

    // subclassing Animal
    var Snake = Klass.create(Animal, {
      initialize: function(name) {
        arguments.callee.applySuper(this,[name, 'hissssssssss']);
      }
    });

    var ringneck = Snake.create("Ringneck");
    ringneck.speak();

    //-> alerts "Ringneck says: hissssssss!"

    // adding Snake#speak (with a supercall)
    Snake.include({
      speak: function() {
        arguments.callee.callSuper(this);
        alert("You should probably run. He looks really mad.");
      }
    });

    ringneck.speak();
    //-> alerts "Ringneck says: hissssssss!"
    //-> alerts "You should probably run. He looks really mad."

    // redefining Animal#speak
    Animal.include({
      speak: function() {
        alert(this.name + ' snarls: ' + this.sound + '!');
      }
    });

    ringneck.speak();
    //-> alerts "Ringneck snarls: hissssssss!"
    //-> alerts "You should probably run. He looks really mad."

### Now. Where we differ
    
    
#### Create vs. new and instanceof

  Why do we use a create method rather then Javascript's built in new operator?
  
  **The short answer**: *Objects that inherit from other objects cannot also be functions.*
  
  So in order for Klass objects to inherit from their parents they need to be plain old objects and therefor cannot be constructors.
  Search the source for `function createKlassInstance` to understand how this magic works.

    var Human = Klass.create('Human');

    Human instanceof Klass;
    //-> TypeError: invalid 'instanceof' operand Klass
    
    Object.instanceOf(Klass, Human);
    //-> true
    
    Human.isA(Klass);
    //-> true

    var paul = Human.create();

    paul instanceof Human;
    //-> TypeError: invalid 'instanceof' operand Human

    Object.instanceOf(Human, paul);
    //-> true
    
    paul.instanceOf(Human);
    //-> true
    
    paul.instanceOf(Klass);
    //-> false

    paul.isA(Human);
    //-> true
    
    
#### Class and Instance inheritance

    var LifeForm = Klass.create();

    LifeForm.birth = function(){ return 'born'; };
    LifeForm.prototype.alive = true;

    var Ameba = Klass.create(LifeForm);

    Ameba.birth();
    //-> 'born'

    LifeForm.birth = function(){ return 'waaaa waaaa'; };

    Ameba.birth();
    //-> 'waaaa waaaa'

    var amy = Ameba.create();

    amy.alive;
    //-> true

    LifeForm.prototype.alive = false;

    amy.alive
    //-> false

    amy.klass.birth();
    //-> 'waaaa waaaa'

#### Pretty Class Reopening

    var Puppet = Klass.create();

    klass(Puppet, function(self){
      this.initialize: function(){
        ...
      };

      self.aNewClassMethod = function(){
        ...
      };
    });


    klass(Puppet,{
      aNewInstanceMethod: function(){
        ...
      }
    });

#### klass_name

  In order to provide pretty toString values, making your Firebug experience that much better, we guess the klass_name from
  either a passed in String or the name of the first argument of the first definition function that has one

    var Frog = Klass.create(function(Frog){ ... });
    Frog.klass_name
    //-> 'Frog'

    Klass.create('KittyCat',{...}).klass_name
    //-> 'KittyCat'

#### Class definitions via Function (more ruby like)

    var Human = Klass.create(function(Human, instance){
      // this === Human.prototype
      // Human === window.Human
      // instance == Human.prototype
      // Human.klass_name == 'Human' (klass_name is infered by the first argument of the given definition function)

      Human.instances = [];

      // create a class method
      Human.findByName = function findByName(name){
        // this === Human
        return this.instances.find(function(instance){
          return instance.name == name;
        });
      };

      this.initialize = function(name){
        // this == Human:instance:X
        // this.klass === Human
        this.klass.instances.push(this);
        this.name = name;
      };

      function getName(){
        return this.name;
      };

      // class instance (prototype) is extended with returned object
      return {
        getName: getName
      };
    });

    var pedro = Human.create('Pedro');
    //-> Human:instance

    Human.findByName('Pedro');
    //-> pedro


#### Super
  Prototype's $super works by defining a methods relationship to it's super method
  when it's defined using addMethods. Our super implementation is a bit more verbose
  but avoids that extra work and allows you to move Functions around any way you like.

    var Human; // see above example

    var FakeHuman = Klass.create(Human, {
      getName: function(){
        return arguments.callee.callSuper(this)+' the fake human';
      }
    });

    FakeHuman.create('Darel').getName();
    //-> "Darel the fake human"

    FakeHuman.prototype.getTheName = FakeHuman.prototype.getName;

    FakeHuman.create('Mork').getTheName();
    //-> NoSuperError: no superclass method

    // Alias Method to the rescue!
    FakeHuman.prototype.aliasMethod('getTheName', 'getName');

    FakeHuman.create('Mork').getTheName();
    //-> "Mork the fake human"

    // Alias method clones (wraps) the original function and then casts its
    // property name to the original method's property name at the time of
    // the aliasing. Function#getSuper knows look for this so it can find
    // the right super method

#### Extend and Include
  We're also a bit more Ruby like when it comes to mixins.

    var MotorVehicle = {
      drive: function(){ return "driving"; }
    }

    var Drivables = {
      createTruck: function(){ return this.create("truck"); }
    }

    var Car = Klass.create(function(Car){
      this.initialize = function(type){
        this.type = type;
      };
      Car.include(MotorVehicle);
      Car.extend(Drivables);
    });

    Car.create().drive();
    //-> 'driving'

    Car.createTruck();
    //-> [Car:instance type=truck klass=Car]

#### Modules
  Modules are simply a objects that when extended onto a klass have all their properties copied the
  klass object. Additionally if the module has a 'prototype' property defined it does not overwrite 
  the klass's current prototype object but rather is extended upon it. This allows modules to have
  klass and instance properties.

    var Openable = {
      findAllOpen: function(){},
      findAllClosed: function(){},
      prototype: {
        open: function(){},
        close: function(){}
      }
    };

    var Box = Klass.create();
    Box.extend(Openable);

    Openable.findAllOpen === Box.findAllOpen;
    //-> true
    Openable.findAllClosed === Box.findAllClosed;
    //-> true
    Openable.prototype.open === Box.create().open;
    //-> true
    Openable.prototype.close === Box.create().close;
    //-> true
