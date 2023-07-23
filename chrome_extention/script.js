document.getElementById('getJobId').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    let url = tabs[0].url;
    let jobId = url.substring(url.lastIndexOf('=') + 1);
    document.getElementById('jobIdDisplay').innerText = jobId;
    chrome.tabs.create({ url: `http://localhost:3000/?jobId=${jobId}` });
  });
});
