/**
 * Decorador de Tiempo de Ejecución
 * 
 * Mide y registra el tiempo que tarda en ejecutarse un método.
 * Se puede aplicar a cualquier método de clase.
 * 
 * Uso:
 * @ExecutionTime()
 * async myMethod() { ... }
 * 
 * @ExecutionTime('Custom Label')
 * async anotherMethod() { ... }
 */
export function ExecutionTime(label?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodLabel = label || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const end = performance.now();
        const duration = (end - start).toFixed(2);
        
        console.log(`⏱️  [${methodLabel}] executed in ${duration}ms`);
        
        return result;
      } catch (error) {
        const end = performance.now();
        const duration = (end - start).toFixed(2);
        
        console.log(`⏱️  [${methodLabel}] failed after ${duration}ms`);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Versión síncrona del decorador para métodos que no son async
 */
export function ExecutionTimeSync(label?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodLabel = label || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      
      try {
        const result = originalMethod.apply(this, args);
        const end = performance.now();
        const duration = (end - start).toFixed(2);
        
        console.log(`⏱️  [${methodLabel}] executed in ${duration}ms`);
        
        return result;
      } catch (error) {
        const end = performance.now();
        const duration = (end - start).toFixed(2);
        
        console.log(`⏱️  [${methodLabel}] failed after ${duration}ms`);
        throw error;
      }
    };

    return descriptor;
  };
}
