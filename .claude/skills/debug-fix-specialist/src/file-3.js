// Event handler properly bound with async/await and full error handling
async function handleSave(e) {
  e.preventDefault();
  
  try {
    const formData = getFormData();
    const response = await api.saveProfile(formData);
    
    if (response.success) {
      updateLocalState(response.data);
      showSuccessMessage('Profile saved');
    } else {
      showErrorMessage(response.error || 'Save failed');
    }
  } catch (error) {
    console.error('Save error:', error);
    showErrorMessage('Unable to save profile. Please try again.');
    logErrorToService(error);
  }
}
