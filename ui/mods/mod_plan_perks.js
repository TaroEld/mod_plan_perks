

CharacterScreenPerksModule.prototype.create = function(_parentDiv)
{
    this.createDIV(_parentDiv);
    this.createPerkDiv(_parentDiv)
};

CharacterScreenPerksModule.prototype.createPerkDiv = function (_parentDiv)
{



	if(!("perks.saved-list-loaded" in this.mDataSource.mEventListener)){
		this.mDataSource.mEventListener['perks.saved-list-loaded'] = [ ];
		this.mDataSource.addListener('perks.saved-list-loaded', jQuery.proxy(this.setupPerkList, this));
	}

	var self = this;




    this.mParentPanel = $('<div class="slot-count-panel"/>');
    this.mContainer.append(this.mParentPanel);

    this.mPerkPlanningPanel = $('<div class="filter-panel"/>');
    //this.mPerkPlanningContainer = $('<div class="slot-count-container"/>');
    this.mParentPanel.append(this.mPerkPlanningPanel)

    var layout = $('<div class="l-button is-sort"/>');
    this.mPerkPlanningPanel.append(layout);
    this.mResetPlannedPerksButton = layout.createImageButton(Path.GFX + "ui/buttons/reset_selected_perks.png", function ()
    {
		var callback = function (data)
	    {
	        if (data === undefined || data === null || typeof (data) !== 'object')
	        {
	            console.error('ERROR: Failed to update brother. Invalid data result.');
	            return;
	        }

	        // check if we have an error
	        if (ErrorCode.Key in data)
	        {
	            self.notifyEventListener(ErrorCode.Key, data[ErrorCode.Key]);
	        }
	        else
	        {
	            // find the brother and update him
	            if (CharacterScreenIdentifier.Entity.Id in data)
	            {
	                self.mDataSource.updateBrother(data);
	            }
	            else
	            {
	            	console.error('ERROR: Failed to update brother. Invalid data result.');
	            }
	        }
	    }
    	self.mDataSource.notifyBackendClearPerksButtonClicked(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], callback);
    }, '', 3);
    this.mResetPlannedPerksButton.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.clear-perks-button" });

    var layout = $('<div class="l-button is-all-filter"/>');
    this.mPerkPlanningPanel.append(layout);
    this.mSavePerksButton = layout.createImageButton(Path.GFX + "ui/buttons/open_save_menu.png", function ()
    {
        self.showSaveAndLoadPerksDialog();
    }, '', 3);
    this.mSavePerksButton.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.save-perks-button" });
    
};

CharacterScreenPerksModule.prototype.showSaveAndLoadPerksDialog = function()
{
    this.mDataSource.notifyBackendPopupDialogIsVisible(true);
    var self = this;
    this.mPopupDialog = $('.character-screen').createPopupDialog('Save and Load Perk Builds', null, null, 'save-and-load-perks-popup');
    this.mPopupDialog.addPopupDialogContent(this.createSaveAndLoadPerksDialogContent(this.mPopupDialog));
    this.mPopupDialog.addPopupDialogCancelButton(function (_dialog)
    {
        _dialog.destroyPopupDialog();
        self.mDataSource.notifyBackendPopupDialogIsVisible(false);
    });

};

CharacterScreenPerksModule.prototype.getCurrentlySelectedPerks = function()
{
	var numSelected = 0;
	for (var row = 0; row < this.mPerkTree.length; ++row)
	{
		for (var i = 0; i < this.mPerkTree[row].length; ++i)
		{

			var perk = this.mPerkTree[row][i];
			if (perk.Selected) numSelected++
		}
	}
	return numSelected
}
CharacterScreenPerksModule.prototype.checkForDelimiters = function(_string){
	return (_string.search("°") ==  -1 && _string.search("~") ==  -1)
}
CharacterScreenPerksModule.prototype.createSaveAndLoadPerksDialogContent = function (_dialog)
{

    var result = $('<div class="save-and-load-perks-container"/>');
	var self = this;

	//SAVE PERKS DIV -------------------------------------------------------------------------------------------------------------------------------------------------
	var savePerksContainer = $('<div class="save-perks-container"/>');
	result.append(savePerksContainer)

	//SAVE PERKS FROM CODE-------------------------------------------

	var savePerksFromCodeContainer = $('<div class="save-perks-from-code-container"/>');
	savePerksContainer.append(savePerksFromCodeContainer)

	var header = $('<div class="header has-no-sub-title"/>');
	savePerksFromCodeContainer.append(header);
	var titleTextContainer = $('<div class="text-container"/>');
	header.append(titleTextContainer);
	var title = $('<div class="title title-font-very-big font-bold font-bottom-shadow font-color-title">Save Perk Builds</div>');
	titleTextContainer.append(title)

	//input name for current build, disables the save perks button if empty
    var inputLayout = $('<div class="l-input"/>');
    savePerksFromCodeContainer.append(inputLayout);
    var inputField = inputLayout.createInput('', 0, 9999, 1, function (_input)
	{
        _dialog.find('.save-perks-button').enableButton((_input.getInputTextLength() >= Constants.Game.MIN_BROTHER_NAME_LENGTH) && (self.getCurrentlySelectedPerks() > 0) && self.checkForDelimiters(_input.getInputText()));
    }, 'title-font-big font-bold font-color-brother-name');
    inputField.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.perk-build-name-input" });

    //save perks button
	buttonLayout = $('<div class="l-button"/>');
	savePerksFromCodeContainer.append(buttonLayout);
	button = buttonLayout.createTextButton("Save Build", function ()
    {
		var callback = function (data)
	    {
	    	self.mDataSource.notifyBackendLoadSavedPerks()
	        // check if we have an error
	        if (ErrorCode.Key in data)
	        {
	            self.notifyEventListener(ErrorCode.Key, data[ErrorCode.Key]);
	        }
	        else
	        {
	            // find the brother and update him
	            if (CharacterScreenIdentifier.Entity.Id in data)
	            {
	                self.mDataSource.updateBrother(data);
	            }
	            else
	            {
	                console.error('ERROR: Failed to update brother. Invalid data result.');
	            }
	        }
	    }
	    var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    var inputFields = contentContainer.find('input');
        self.mDataSource.notifyBackendSaveSelectedPerks(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], $(inputFields[0]).getInputText(), callback);
    }, 'save-perks-button', 1)
    button.enableButton(false);
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.save-perks-button" });

    buttonLayout = $('<div class="l-button"/>');
    savePerksFromCodeContainer.append(buttonLayout)
	button = buttonLayout.createTextButton("Export Build", function ()
    {
	    
    	var callback = function (data)
        {
        	var code = data.parsedCode
            var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    	var inputFields = contentContainer.find('input');
	    	$(inputFields[0]).setInputText(code);
	    	$(inputFields[0]).select()
	    	document.execCommand('copy');
	    	$(inputFields[0]).setInputText("");
        }
        self.mDataSource.notifyBackendExportCurrentPerks(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], callback);

    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.copy-perks-button" });
    



    //LOAD PERKS DIV -----------------------------------------------------------------------------------------------------------------------------------------

	var loadPerksContainer = $('<div class="load-perks-container"/>');
	result.append(loadPerksContainer)

	//header
	header = $('<div class="header has-no-sub-title put-border-top"/>');
	loadPerksContainer.append(header);
	titleTextContainer = $('<div class="text-container"/>');
	header.append(titleTextContainer);
	title = $('<div class="title title-font-very-big font-bold font-bottom-shadow font-color-title">Load Perk Builds</div>');
	titleTextContainer.append(title)

	var loadPerksFromCodeContainer = $('<div class="load-perks-from-code-container"/>');
	loadPerksContainer.append(loadPerksFromCodeContainer)
	//load one perk build
    var inputLayout = $('<div class="l-input"/>');
    loadPerksFromCodeContainer.append(inputLayout);
    var inputCodeField = inputLayout.createInput('', 0, 9999, 1, function (_input)
	{
    }, 'title-font-big font-bold font-color-brother-name', function (_input)
	{
	});
	inputCodeField.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.perk-code-input" });


	var buttonLayout = $('<div class="l-button"/>');
	loadPerksFromCodeContainer.append(buttonLayout);
	var button = buttonLayout.createTextButton("Paste Clipboard", function ()
    {
	    var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    var inputFields = contentContainer.find('input');
    	$(inputFields[1]).select()
    	document.execCommand('paste');
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.paste-perks-button" });


	buttonLayout = $('<div class="l-button"/>');
	loadPerksFromCodeContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("Apply Build", function ()
    {
		var callback = function (data)
	    {

	        // check if we have an error
	        if (ErrorCode.Key in data)
	        {
	            self.notifyEventListener(ErrorCode.Key, data[ErrorCode.Key]);
	        }
	        else
	        {
	            // find the brother and update him
	            if (CharacterScreenIdentifier.Entity.Id in data)
	            {
	                self.mDataSource.updateBrother(data);
	            }
	            else
	            {
	                console.error('ERROR: Failed to update brother. Invalid data result.');
	            }
	        }
	    }

	    var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    var inputFields = contentContainer.find('input');
	    var overrideToggle = document.getElementById('override-toggle').checked
        self.mDataSource.notifyBackendApplyPerkBuildFromCode(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], $(inputFields[1]).getInputText(), overrideToggle, callback);
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.load-single-build-button" });

	buttonLayout = $('<div class="l-button"/>');
	loadPerksFromCodeContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("Import Build(s)", function ()
    {
		var callback = function (data)
	    {
	    	self.mDataSource.notifyBackendLoadSavedPerks()
	    }
	    var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    var inputFields = contentContainer.find('input');
        self.mDataSource.notifyBackendImportPerkBuildsFromCode($(inputFields[1]).getInputText(), callback);
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.load-all-builds-button" });

	//toggle override
	var toggleContainer = $('<div class="control"/>');
	loadPerksFromCodeContainer.append(toggleContainer);
	var overrideToggle = $('<input type="checkbox" id="override-toggle"/>');
	toggleContainer.append(overrideToggle);
	this.mOverrideToggle = overrideToggle
	var overrideLabel = $('<label class="text-font-normal font-color-subtitle" for="override-toggle">Override current selection</label>');
	toggleContainer.append(overrideLabel);
	overrideToggle.iCheck(
	{
	    checkboxClass: 'icheckbox_flat-orange',
	    radioClass: 'iradio_flat-orange',
	    increaseArea: '30%'
	}, '', 1)
	overrideToggle.iCheck('check')
	toggleContainer.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.override-perks-toggle" });
	
	

	var filterBarContainer = $('<div class="load-perks-from-code-container"/>');
	loadPerksContainer.append(filterBarContainer)

	buttonLayout = $('<div class="l-button"/>');
	filterBarContainer.append(buttonLayout);
	button = buttonLayout.createTextButton("Sort By Missing Perks", function ()
    {
    	if (self.mSortingFunction == "byMissingPerks") self.mSortingFunction = "byMissingPerksReverse"
    	else self.mSortingFunction = "byMissingPerks"
		self.mDataSource.notifyBackendLoadSavedPerks()
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.sort-by-missing-button" });

	buttonLayout = $('<div class="l-button"/>');
	filterBarContainer.append(buttonLayout);
	button = buttonLayout.createTextButton("Sort Alphabetically", function ()
    {
    	if (self.mSortingFunction == "byAlphabetical") self.mSortingFunction = "byAlphabeticalReverse"
    	else self.mSortingFunction = "byAlphabetical"
		self.mDataSource.notifyBackendLoadSavedPerks()
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.sort-alphabetically-button" });

	buttonLayout = $('<div class="l-button"/>');
	filterBarContainer.append(buttonLayout);
	button = buttonLayout.createTextButton("Sort by Unlocked Perks", function ()
    {
    	if (self.mSortingFunction == "byMatchingPerks") self.mSortingFunction = "byMatchingPerksReverse"
    	else self.mSortingFunction = "byMatchingPerks"
		self.mDataSource.notifyBackendLoadSavedPerks()
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.sort-by-matching-button" });

    buttonLayout = $('<div class="l-button far-right"/>');
    filterBarContainer.append(buttonLayout)
	button = buttonLayout.createTextButton("Export All Builds", function ()
    {
	    
    	var callback = function (data)
        {
        	var code = data.parsedCode
            var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    	var inputFields = contentContainer.find('input');
	    	$(inputFields[0]).setInputText(code);
	    	$(inputFields[0]).select()
	    	document.execCommand('copy');
	    	$(inputFields[0]).setInputText("");
        }
        self.mDataSource.notifyBackendExportAllPerkBuilds(callback);

    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.copy-all-perks-button" });







	//scroll container
	var listContainerLayout = $('<div class="l-list-container"/>');
	loadPerksContainer.append(listContainerLayout);





	var mylist = $('<div class="ui-control list"/>');

	var scrollContainer = $('<div class="scroll-container"/>');
	mylist.append(scrollContainer);

	listContainerLayout.append(mylist);

	 // NOTE: create scrollbar (must be after the list was appended to the DOM!)
	 this.mListContainer = mylist
	 this.mListScrollContainer = scrollContainer





	 this.mSortingFunction = "byAlphabetical"
	this.mDataSource.notifyBackendLoadSavedPerks()

    return result;
    
};
CharacterScreenPerksModule.prototype.setupPerkList = function(_datasource, _data){
	if (this.mListScrollContainer === undefined){
		console.error("mListScrollContainer undefined")
		return
	}
	this.mListScrollContainer.empty()

	var brother = this.mDataSource.getSelectedBrother()

	var divResultList = []
	
	for (var key in _data){
	  divResultList.push(this.addListEntry(key))
	}
	var sortingFunctions = {
		byMatchingPerks : function(a, b) {
			var num = b.numOfMatchingPerks - a.numOfMatchingPerks
			if (num == 0){
			  if(a.buildName < b.buildName) { return -1; }
		      if(a.buildName > b.buildName) { return 1; }
		      return 0;
			}
		  	return num
		},
		byMatchingPerksReverse : function(a, b) {
			var num = a.numOfMatchingPerks - b.numOfMatchingPerks;
			if (num == 0){
			  if(a.buildName < b.buildName) { return -1; }
		      if(a.buildName > b.buildName) { return 1; }
		      return 0;
			}
		  	return num
		},
		byAlphabetical : function(a, b) {
		  if(a.buildName < b.buildName) { return -1; }
	      if(a.buildName > b.buildName) { return 1; }
	      return 0;
		},
		byAlphabeticalReverse : function(a, b) {
		  if(a.buildName > b.buildName) { return -1; }
	      if(a.buildName < b.buildName) { return 1; }
	      return 0;
		},
		byMissingPerks : function(a, b) {
			var num = a.numOfMissingPerkInList - b.numOfMissingPerkInList;
			if (num == 0){
			  if(a.buildName < b.buildName) { return -1; }
		      if(a.buildName > b.buildName) { return 1; }
		      return 0;
			}
		 	 return num
		},
		byMissingPerksReverse : function(a, b) {
			var num = b.numOfMissingPerkInList - a.numOfMissingPerkInList;
			if (num == 0){
			  if(a.buildName < b.buildName) { return -1; }
		      if(a.buildName > b.buildName) { return 1; }
		      return 0;
			}
		 	 return num
		},
	}
	
	divResultList.sort(sortingFunctions[this.mSortingFunction]); 


	for (var div in divResultList){
		this.mListScrollContainer.append(divResultList[div].div);
	}
	this.mListContainer.aciScrollBar({
         delta: 8,
         lineDelay: 0,
         lineTimer: 0,
         pageDelay: 0,
         pageTimer: 0,
         bindKeyboard: false,
         resizable: false,
         smoothScroll: false
     });
}
CharacterScreenPerksModule.prototype.addListEntry = function (_data)
{
	var self = this;
	var brother = this.mDataSource.getSelectedBrother()
	var brotherPerks = brother[CharacterScreenIdentifier.Perk.Key]

	var isPerkUnlocked = function(_perksUnlocked, _perkID) {
		for (var j = 0; j < _perksUnlocked.length; ++j)
		{
			if(_perksUnlocked[j] == _perkID)
			{
				return true
			}
		}
		return false
	}

	var numPerks = 0;
	var numMissingPerkInList = 0


	var perkBuild = this.mDataSource.mSavedPerkBuilds[_data]
	var result = $('<div class="l-row"/>');
	var entry = $('<div class="ui-control list-entry"/>');
	result.append(entry)
	var nameContainer = $('<div class="l-perk-name-container"/>');
	entry.append(nameContainer)
	var name = $('<div class="name text-font-normal font-color-description perk-name">' + _data + '</div>');
	nameContainer.append(name);
	var perkImageContainer = $('<div class="l-perk-image-container"/>');
	entry.append(perkImageContainer);
	var currentLeft = 0;
	for (var x = 0; x < perkBuild.length; x++){
		var perkID = perkBuild[x]
		var isUnlocked = isPerkUnlocked(brotherPerks, perkID)
		var hasPerkInList = this.mPerksToImageDict[perkID].hasPerkInTree
		var perkImage = $('<img class="perk-image"/>');
		var perkOverlayImage = $('<img class="perk-image-overlay"/>');
		perkOverlayImage.attr('src', Path.GFX + 'ui/perks/missing-from-perks.png');
		if (isUnlocked === true){
			perkImage.attr('src', Path.GFX + this.mPerksToImageDict[perkID].unlocked);
			numPerks++
		}
		else{
			perkImage.attr('src', Path.GFX + this.mPerksToImageDict[perkID].locked);
		}
		perkImage.unbindTooltip();
		perkImage.bindTooltip({ contentType: 'ui-perk', entityId: brother[CharacterScreenIdentifier.Entity.Id], perkId: perkID });
		if(hasPerkInList === false){
			perkOverlayImage.css("left", currentLeft+'rem')
			perkImageContainer.append(perkOverlayImage);
			numMissingPerkInList++
		}


		perkImageContainer.append(perkImage);
		currentLeft += 3;
	}

	var buttonContainer = $('<div class="l-perk-button-container"/>');
	entry.append(buttonContainer)

	var buttonLayout = $('<div class="l-button"/>');
	buttonContainer.append(buttonLayout);
	
	var button = buttonLayout.createTextButton("Apply", function ()
    {
		var callback = function (data)
	    {
	    	self.mDataSource.updateBrother(data);
	    }
	    var overrideToggle = document.getElementById('override-toggle').checked
        self.mDataSource.notifyBackendApplyBuildFromName(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], _data, overrideToggle, callback);
    }, '', 2)
	button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.list.load-perks-button" });

	buttonLayout = $('<div class="l-button"/>');
	buttonContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("Export", function ()
    {
    	var callback = function (data)
        {
        	var code = data.parsedCode
            var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    	var inputFields = contentContainer.find('input');
	    	$(inputFields[0]).setInputText(code);
	    	$(inputFields[0]).select()
	    	document.execCommand('copy');
	    	$(inputFields[0]).setInputText("");
        }
        self.mDataSource.notifyBackendExportSinglePerkBuildFromName(_data, callback);
    }, '', 2)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.list.copy-perks-button" });

	buttonLayout = $('<div class="l-button"/>');
	buttonContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("Delete", function ()
    {
		var callback = function (data)
	    {
	    	self.mDataSource.notifyBackendLoadSavedPerks()
	    }
        self.mDataSource.notifyBackendDeletePerkBuild(_data, callback);
    }, '', 2)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.list.delete-perks-button" });

    var totalResult = {
    	div: result,
    	numOfMatchingPerks : numPerks,
    	numOfMissingPerkInList : numMissingPerkInList,
    	buildName : _data,
    }
	return totalResult

};

CharacterScreenPerksModule.prototype.destroyDIV = function ()
{
	this.mPerkPlanningPanel = null;


    this.mLeftColumn.empty();
    this.mLeftColumn.remove();
    this.mLeftColumn = null;

    this.mContainer.empty();
    this.mContainer.remove();
    this.mContainer = null;

};

CharacterScreenPerksModule.prototype.attachEventHandler = function(_perk)
{
	var self = this;

	_perk.Container.on('mouseenter focus' + CharacterScreenIdentifier.KeyEvent.PerksModuleNamespace, null, this, function (_event)
	{
		var selectable = !_perk.Unlocked && self.isPerkUnlockable(_perk);

		if (selectable === true && !_perk.Selected)
		{
			var selectionLayer = $(this).find('.selection-image-layer:first');
			selectionLayer.removeClass('display-none').addClass('display-block');
		}
	});

	_perk.Container.on('mouseleave blur' + CharacterScreenIdentifier.KeyEvent.PerksModuleNamespace, null, this, function (_event)
	{
		var selectable = !_perk.Unlocked && self.isPerkUnlockable(_perk);

		if (selectable === true && !_perk.Selected)
		{
			var selectionLayer = $(this).find('.selection-image-layer:first');
			selectionLayer.removeClass('display-block').addClass('display-none');
		}
	});

	_perk.Container.mousedown(this, function (_event)
	{
		if (event.which === 3)
        {
        	var callback = function (data)
		    {
		        if (data === undefined || data === null || typeof (data) !== 'object')
		        {
		            console.error('ERROR: Failed to unlock perk. Invalid data result.');
		            return;
		        }

		        // check if we have an error
		        if (ErrorCode.Key in data)
		        {
		            self.notifyEventListener(ErrorCode.Key, data[ErrorCode.Key]);
		        }
		        else
		        {
		            // find the brother and update him
		            if (CharacterScreenIdentifier.Entity.Id in data)
		            {
		                self.mDataSource.updateBrother(data);
		            }
		            else
		            {
		                console.error('ERROR: Failed to unlock perk. Invalid data result.');
		            }
		        }
		    }
        	var selectionLayer = _perk.Container.find('.selection-image-layer:first');
        	if (_perk.Selected === false){
        		_perk.Selected = true;
        		selectionLayer.attr('src', Path.GFX + 'ui/perks/selection_frame_planning.png');
        		selectionLayer.removeClass('display-none').addClass('display-block');
        		self.mDataSource.notifyBackendUpdateSelectedPerk(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], _perk.ID, 1, callback)
        	}
        	else{
        		_perk.Selected = false;
        		selectionLayer.attr('src', Path.GFX + Asset.PERK_SELECTION_FRAME);
        		if(!_perk.Unlocked){
        			selectionLayer.removeClass('display-block').addClass('display-none');
        		}
        		self.mDataSource.notifyBackendUpdateSelectedPerk(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], _perk.ID, 0, callback)
        	}
        	
        }
		if (event.which === 1)
        {
			var selectable = !_perk.Unlocked && self.isPerkUnlockable(_perk);

			if (selectable == true && self.mDataSource.isInStashMode())
			{
				self.showPerkUnlockDialog(_perk);
			}
		}
	});
}
CharacterScreenPerksModule.prototype.initPerkToImageDict = function (_perkTree)
{
	this.mPerksToImageDict = {}
	for (var row = 0; row < _perkTree.length; ++row)
	{
		for (var i = 0; i < _perkTree[row].length; ++i)
		{

			var perk = _perkTree[row][i];
			this.mPerksToImageDict[perk.ID] = {
				unlocked : perk.Icon,
				locked : perk.IconDisabled,
				hasPerkInTree: true
			}
		}
	}
}
CharacterScreenPerksModule.prototype.initPerkToImageDictLegends = function (_perkTree)
{
	this.mPerksToImageDict = {}
	for (var i = 0; i < _perkTree.length; ++i)
	{
		var perk = _perkTree[i];
		this.mPerksToImageDict[perk.ID] = {
			unlocked : perk.Icon,
			locked : perk.IconDisabled,
			hasPerkInTree: false
		}
	}
	for (var row = 0; row < this.mPerkTree.length; ++row)
	{
		for (var i = 0; i < this.mPerkTree[row].length; ++i)
		{
			var perk = this.mPerkTree[row][i];
			this.mPerksToImageDict[perk.ID].hasPerkInTree = true;
		}
	}
}

CharacterScreenPerksModule.prototype.initPerkTree = function (_perkTree, _perksUnlocked, _selectedPerks)
{
	var perkPointsSpent = this.mDataSource.getBrotherPerkPointsSpent(this.mDataSource.getSelectedBrother());
	var idx = 0;
	for (var row = 0; row < _perkTree.length; ++row)
	{
		for (var i = 0; i < _perkTree[row].length; ++i)
		{

			var perk = _perkTree[row][i];

			for (var j = 0; j < _perksUnlocked.length; ++j)
			{
				if(_perksUnlocked[j] == perk.ID)
				{1
					perk.Unlocked = true;

					perk.Image.attr('src', Path.GFX + perk.Icon);

					var selectionLayer = perk.Container.find('.selection-image-layer:first');
					selectionLayer.removeClass('display-none').addClass('display-block');

					break;
				}
			}

			if (perk.ID in _selectedPerks){
				perk.Selected = true;
				var selectionLayer = perk.Container.find('.selection-image-layer:first');
				selectionLayer.attr('src', Path.GFX + 'ui/perks/selection_frame_planning.png');
				selectionLayer.removeClass('display-none').addClass('display-block');

			}
			else{
				perk.Selected = false;
				var selectionLayer = perk.Container.find('.selection-image-layer:first');
				selectionLayer.attr('src', Path.GFX + Asset.PERK_SELECTION_FRAME);
			}
			
			idx = idx + 1;
		}
	}
	
	for (var row = 0; row < this.mPerkRows.length; ++row)
	{
		if (row <= perkPointsSpent)
		{
			this.mPerkRows[row].addClass('is-unlocked').removeClass('is-locked');
		}
		else
		{
			break;
		}
	}
};

CharacterScreenPerksModule.prototype.loadPerkTreesWithBrotherData = function (_brother)
{
	var self = this;
	var callback = function(_data){
		if (!_data[0]){
			self.resetPerkTree(self.mPerkTree);
			self.initPerkToImageDict(self.mPerkTree)
		}
		else{
			self.setupPerkTree(_brother[CharacterScreenIdentifier.Perk.Tree]);
			self.initPerkToImageDictLegends(_data[1])
		}

		if (CharacterScreenIdentifier.Perk.Key in _brother)
		{
		    self.initPerkTree(self.mPerkTree, _brother[CharacterScreenIdentifier.Perk.Key], _brother["selectedPerks"]);
		}

		if (CharacterScreenIdentifier.Entity.Id in _brother)
		{
		    self.setupPerkTreeTooltips(self.mPerkTree, _brother[CharacterScreenIdentifier.Entity.Id]);
		}
	}
	this.mDataSource.notifyBackendQueryForLegends(callback)

};

CharacterScreenDatasource.prototype.notifyBackendQueryForLegends = function(_callback)
{
	SQ.call(this.mSQHandle, 'onQueryLegends', [], _callback);
}

//update single selected perk for a specific brother after rightclicking
CharacterScreenDatasource.prototype.notifyBackendUpdateSelectedPerk = function(_brother, _perkID, _bool, _callback)
{
	SQ.call(this.mSQHandle, 'onUpdateSelectedPerk', [_brother, _perkID, _bool], _callback);

}

//clear all selected perks for specific brother
CharacterScreenDatasource.prototype.notifyBackendClearPerksButtonClicked = function(_brother, _callback)
{

	SQ.call(this.mSQHandle, 'onClearSelectedPerks', [_brother], _callback);

}

//save selected perks of a brother as a new perk build
CharacterScreenDatasource.prototype.notifyBackendSaveSelectedPerks = function(_brother, _perkName, _callback)
{
	SQ.call(this.mSQHandle, 'onSaveSelectedPerks', [_brother, _perkName], _callback);
}

//load all saved builds with a callback to update the scroll container
CharacterScreenDatasource.prototype.notifyBackendLoadSavedPerks = function()
{
	var self = this;
	var callback = function(_data){
		self.loadAllPerkBuilds(_data)
	}
	SQ.call(this.mSQHandle, 'onLoadAllPerkBuilds', [], callback);
}

CharacterScreenDatasource.prototype.loadAllPerkBuilds = function(_data)
{	
	this.mSavedPerkBuilds = _data["perks"]
	this.notifyEventListener('perks.saved-list-loaded', _data["perks"]);
}

//apply perk build to brother based on perk name
CharacterScreenDatasource.prototype.notifyBackendApplyBuildFromName = function(_brother, _perkBuildID, _override, _callback)
{

	SQ.call(this.mSQHandle, 'onApplyPerkBuildFromName', [_brother, _perkBuildID, _override], _callback);
}

//apply perk build to brother based on code
CharacterScreenDatasource.prototype.notifyBackendApplyPerkBuildFromCode = function(_brother, _code, _override, _callback)
{

	SQ.call(this.mSQHandle, 'onApplyPerkBuildFromCode', [_brother, _code, _override], _callback);
}

//import perk builds to the list with name
CharacterScreenDatasource.prototype.notifyBackendImportPerkBuildsFromCode = function(_code, _callback)
{

	SQ.call(this.mSQHandle, 'onImportPerkBuildsFromCode', [_code], _callback);
}

//export one perk build after pressing the export button
CharacterScreenDatasource.prototype.notifyBackendExportSinglePerkBuildFromName = function(_perkBuildID, _callback)
{
	SQ.call(this.mSQHandle, 'onExportSinglePerkBuildFromName', [_perkBuildID], _callback);
}

//copy currently selected perks as code
CharacterScreenDatasource.prototype.notifyBackendExportCurrentPerks = function(_brother, _callback)
{

	SQ.call(this.mSQHandle, 'onExportCurrentPerks', [_brother], _callback);
}
//export all perk builds in list after pressing the all builds button
CharacterScreenDatasource.prototype.notifyBackendExportAllPerkBuilds = function(_callback)
{

	SQ.call(this.mSQHandle, 'onExportAllPerkBuilds', [], _callback);
}
//delete perk build from list
CharacterScreenDatasource.prototype.notifyBackendDeletePerkBuild = function(_perkBuildID, _callback)
{

	SQ.call(this.mSQHandle, 'onDeletePerkBuild', [_perkBuildID], _callback);
}
