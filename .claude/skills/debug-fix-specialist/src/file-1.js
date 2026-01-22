// BAD - Overwrites entire settings state
function setEncryptionPassword(password) {
  this.settings = { encryptionPassword: password };
}

// GOOD - Merges encryption with existing settings
function setEncryptionPassword(password) {
  this.settings = { ...this.settings, encryptionPassword: password };
}
