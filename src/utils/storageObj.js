const vscode = require("vscode");
const { createQueue } = require("./misc");

/** @typedef {Boolean} Changed */

/**
 * @template T
 * @typedef {Object} GetterSetter
 * @prop {()=>T} get
 * @prop {function(T):(Changed|Promise<Changed>)} set
 */

const updateConfigQueue = createQueue();
const updateStateQueue = createQueue();

/**
 * @template T
 * @param {vscode.Memento} stateStorage
 * @param {string} key
 * @param {T=} defaults
 * @returns {GetterSetter<T>}
 */
const createStateObject = (stateStorage, key, defaults) => {
  const get = () => stateStorage.get(key) ?? defaults;
  const set = async (value) => {
    const imDone = await updateStateQueue();
    const changed = JSON.stringify(get()) !== JSON.stringify(value);
    stateStorage.update(key, value);
    imDone();
    return changed;
  };
  return { get, set };
};

/**
 * @template T
 * @param {string} section configuration name, supports dotted
 * @param {string} key key name, supports dotted
 * @param {T=} defaults
 * @param {vscode.ConfigurationTarget=} configurationTarget
 * @returns {GetterSetter<T>}
 */
const createConfigObject = (section, key, defaults, configurationTarget = vscode.ConfigurationTarget.Global) => {
  const get = () => vscode.workspace.getConfiguration(section).get(key) || defaults;
  const set = async (value) => {
    const imDone = await updateConfigQueue();
    const changed = JSON.stringify(get()) !== JSON.stringify(value);
    await vscode.workspace.getConfiguration(section).update(key, value, configurationTarget).then();
    imDone();
    return changed;
  };
  return { get, set };
};

/**
 * @template T
 * @param {string} section configuration name, supports dotted
 * @param {string} key key name, supports dotted
 * @param {string} id key name, supports dotted
 * @param {T=} defaults
 * @param {vscode.ConfigurationTarget=} configurationTarget
 * @returns {GetterSetter<T>}
 */
const createListedConfigObject = (
  section,
  key,
  id,
  defaults,
  configurationTarget = vscode.ConfigurationTarget.Global
) => {
  const get = () =>
    vscode.workspace
      .getConfiguration(section)
      .get(key)
      .find((cfg) => cfg.id === id) || { ...defaults };
  const set = async (value) => {
    const imDone = await updateConfigQueue();
    /** @type {Array} */
    const all = vscode.workspace.getConfiguration(section).get(key);
    const index = all.findIndex((e) => e.id === id);
    const old = get();
    value.id = id;
    old.id = id;
    const changed = JSON.stringify(old) !== JSON.stringify(value);
    if (index > -1) all[index] = value;
    else all.push(value);
    await vscode.workspace.getConfiguration(section).update(key, all, configurationTarget);
    imDone();
    return changed;
  };
  return { get, set };
};

const createMappedConfigObject = (
  section,
  key,
  id,
  defaults,
  configurationTarget = vscode.ConfigurationTarget.Global
) => {
  const get = () => vscode.workspace.getConfiguration(section)[key][id] || { ...defaults };
  const set = async (value) => {
    const imDone = await updateConfigQueue();
    let config = vscode.workspace.getConfiguration(section)[key] || {};

    if (JSON.stringify(config[id]) === JSON.stringify(value)) {
      imDone();
      return;
    }
    config = { ...config, [id]: value };

    await vscode.workspace.getConfiguration(section).update(key, config, configurationTarget);

    imDone();
  };
  return { get, set };
};

module.exports = { createStateObject, createConfigObject, createListedConfigObject, createMappedConfigObject };
