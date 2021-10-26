import {InvalidConfiguration} from './index.js';

/**
 * Get an ENV Variable
 * @param {string} name
 * @param {boolean} throwError
 * @return {string}
 */
export default function getEnvironment(name, {throwError=true}={}) {
  // Frontend ENV Prefixes
  const snowpackEnv = 'SNOWPACK_PUBLIC_';
  const reactEnv = 'REACT_APP_';

  // Get current env
  const env = typeof import.meta.env === 'undefined' ?
    process.env :
    import.meta.env;

  // Check for keys
  let value;
  Object.keys(env).forEach((key)=>{
    const isSnowpack = key.match(snowpackEnv);
    const isReact = key.match(reactEnv);
    const prefix = isSnowpack ? snowpackEnv : isReact ? reactEnv : '';

    if (`${prefix}${key}` === name) {
      value = env[`${prefix}${key}`];
    }
  });

  // Return value or throw error
  if (typeof value === 'undefined' && throwError) {
    throw new InvalidConfiguration(`Environment ${name} is not defined!`);
  } else {
    return value;
  }
}
