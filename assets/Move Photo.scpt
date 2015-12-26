JsOsaDAS1.001.00bplist00�Vscript_kfunction run(input, parameters) {
	var sourceFile, currentApp, path, pathItems, photoPath, fileName, filePath, googleChrome, chromeWindow, chromeTab, url, urlItems, newURL;
	
	if (input && Object.keys(input).length) {
		sourceFile = input.toString();
		//Get current application path
		currentApp = Application.currentApplication();
		currentApp.includeStandardAdditions = true;
		path = currentApp.pathTo(this).toString();

		pathItems = path.split('/');

		pathItems.pop();	

		photoPath = pathItems.join('/') + '/photos/';

		currentApp.doShellScript("mv '" + sourceFile + "' '" + photoPath + "'");
	
		//Determine the filepath
		fileName = input.toString().split('/').pop();
		filePath = 'photos/';
	}
	else {
		//No image was taken pass no image found
		fileName = 'no-image-found.png'
		filePath = 'images/';
	}
	
	//Determine the fileName and alert chrome
	googleChrome = Application("Google Chrome");
	chromeWindow = googleChrome.windows[0];
	chromeTab = chromeWindow.tabs[0];
	url = chromeTab.url();

	urlItems = url.split('#');
	newURL = urlItems[0] + "#" + filePath + fileName;
	chromeTab.url = newURL;

	return input;
}                              � jscr  ��ޭ