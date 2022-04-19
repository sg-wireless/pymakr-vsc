class MissingProjectError extends Error {
  /**
   * @param {string=} message 
   */
    constructor(message) {
      super(message || 'Project not found');
      this.name = 'MissingProjectError'
    }
  }
  
const errors = {
    MissingProjectError
}

module.exports = errors