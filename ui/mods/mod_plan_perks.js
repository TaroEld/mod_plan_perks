

CharacterScreenPerksModule.prototype.createDIV = function (_parentDiv)
{
	if(!("perks.saved-list-loaded" in this.mDataSource.mEventListener)){
		this.mDataSource.mEventListener['perks.saved-list-loaded'] = [ ];
		this.mDataSource.addListener('perks.saved-list-loaded', jQuery.proxy(this.setupPerkList, this));
		console.error("added listener")
	}
	else{
		console.error("didn't add listener")
	}
	var self = this;
	// create: containers (init hidden!)
	this.mContainer = $('<div class="perks-module opacity-none"/>');
	_parentDiv.append(this.mContainer);

    // create rows
    this.mLeftColumn = $('<div class="column"/>');
    this.mContainer.append(this.mLeftColumn);

    this.mParentPanel = $('<div class="slot-count-panel"/>');
    this.mContainer.append(this.mParentPanel);

    this.mPerkPlanningPanel = $('<div class="filter-panel"/>');
    //this.mPerkPlanningContainer = $('<div class="slot-count-container"/>');
    this.mParentPanel.append(this.mPerkPlanningPanel)

    var layout = $('<div class="l-button is-sort"/>');
    this.mPerkPlanningPanel.append(layout);
    this.mResetPlannedPerksButton = layout.createImageButton(Path.GFX + Asset.BUTTON_MOOD_FILTER, function ()
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
    	self.mDataSource.notifyBackendClearPerksButtonClicked(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], callback);
    }, '', 3);
    this.mResetPlannedPerksButton.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.clear-perks-button" });

    var layout = $('<div class="l-button is-all-filter"/>');
    this.mPerkPlanningPanel.append(layout);
    this.mSavePerksButton = layout.createImageButton(Path.GFX + Asset.BUTTON_ALL_FILTER, function ()
    {
        self.showSaveAndLoadPerksDialog();
    }, '', 3);
    this.mSavePerksButton.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.save-perks-button" });
    
};

CharacterScreenPerksModule.prototype.showSaveAndLoadPerksDialog = function()
{
    this.mDataSource.notifyBackendPopupDialogIsVisible(true);
    var self = this;
    this.mPopupDialog = $('.character-screen').createPopupDialog('Save and Load Perks', null, null, 'save-and-load-perks-popup');
    this.mPopupDialog.addPopupDialogContent(this.createSaveAndLoadPerksDialogContent(this.mPopupDialog));
    this.mPopupDialog.addPopupDialogCancelButton(function (_dialog)
    {
        _dialog.destroyPopupDialog();
        self.mDataSource.notifyBackendPopupDialogIsVisible(false);
    });

};

CharacterScreenPerksModule.prototype.createSaveAndLoadPerksDialogContent = function (_dialog)
{

    var result = $('<div class="save-and-load-perks-container"/>');
	var self = this;

	//SAVE PERKS DIV -------------------------------------------------------------------------------------------------------------------------------------------------
	var savePerksContainer = $('<div class="save-perks-container"/>');
	result.append(savePerksContainer)

	var header = $('<div class="header has-no-sub-title"/>');
	savePerksContainer.append(header);
	var titleTextContainer = $('<div class="text-container"/>');
	header.append(titleTextContainer);
	var title = $('<div class="title title-font-very-big font-bold font-bottom-shadow font-color-title">Save Perks</div>');
	titleTextContainer.append(title)

	var savePerksFromCodeContainer = $('<div class="save-perks-from-code-container"/>');
	savePerksContainer.append(savePerksFromCodeContainer)

	//input name for current build
    var inputLayout = $('<div class="l-input"/>');
    savePerksFromCodeContainer.append(inputLayout);
    var inputField = inputLayout.createInput('', 0, 9999, 1, null, 'title-font-big font-bold font-color-brother-name');
    inputField.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.perk-build-name-input" });

    //save current build button
	var buttonLayout = $('<div class="l-button"/>');
	savePerksFromCodeContainer.append(buttonLayout);
	var button = buttonLayout.createTextButton("Save Perks", function ()
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
        self.mDataSource.notifyBackendSaveCurrentPerks(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], $(inputFields[0]).getInputText(), callback);
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.save-perks-button" });

	//copy current build code
    buttonLayout = $('<div class="l-button"/>');
    savePerksFromCodeContainer.append(buttonLayout)
	button = buttonLayout.createTextButton("Copy Code", function ()
    {
	    
    	var callback = function (data)
        {
        	var code = data.code
        	console.error(code)
            var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    	var inputFields = contentContainer.find('input');
	    	$(inputFields[0]).setInputText(code);
	    	$(inputFields[0]).select()
	    	document.execCommand('copy');
	    	$(inputFields[0]).setInputText("");
        }
        self.mDataSource.notifyBackendCopyCurrentPerks(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], callback);

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
	title = $('<div class="title title-font-very-big font-bold font-bottom-shadow font-color-title">Load Perks</div>');
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
	var button = buttonLayout.createTextButton("paste clipboard", function ()
    {
	    var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    var inputFields = contentContainer.find('input');
    	$(inputFields[1]).select()
    	document.execCommand('paste');
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.paste-perks-button" });


	buttonLayout = $('<div class="l-button"/>');
	loadPerksFromCodeContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("Load one build", function ()
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
        self.mDataSource.notifyBackendLoadPerksFromCode(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], $(inputFields[1]).getInputText(), callback);
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.load-single-build-button" });

	buttonLayout = $('<div class="l-button"/>');
	loadPerksFromCodeContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("Load many builds", function ()
    {
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.load-all-builds-button" });

	//toggle override
	var toggleContainer = $('<div class="control"/>');
	loadPerksFromCodeContainer.append(toggleContainer);
	var overrideToggle = $('<input type="checkbox" id="override-toggle"/>');
	toggleContainer.append(overrideToggle);
	var overrideLabel = $('<label class="text-font-normal font-color-subtitle" for="override-toggle">Override current selection</label>');
	toggleContainer.append(overrideLabel);
	overrideToggle.iCheck(
	{
	    checkboxClass: 'icheckbox_flat-orange',
	    radioClass: 'iradio_flat-orange',
	    increaseArea: '30%'
	}, '', 1)
	toggleContainer.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.override-perks-toggle" });
	
	


	//scroll container

	var listContainerLayout = $('<div class="l-list-container"/>');
	loadPerksContainer.append(listContainerLayout)
	this.mListContainer = listContainerLayout.createList(1.0, null, true);
	this.mListScrollContainer = this.mListContainer.findListScrollContainer();
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
	
	divResultList.sort(function(a, b) {
	  return b.numOfMatchingPerks - a.numOfMatchingPerks;
	}); 


	for (var div in divResultList){
		this.mListScrollContainer.append(divResultList[div].div);
	}
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
	for (var x = 0; x < perkBuild.length; x++){
		var perkID = perkBuild[x]
		var isUnlocked = isPerkUnlocked(brotherPerks, perkID)
		var perkImage = $('<img class="perk-image"/>');
		if (isUnlocked === true){
			perkImage.attr('src', Path.GFX + this.mPerksToImageDict[perkID].unlocked);
			numPerks++
		}
		else{
			perkImage.attr('src', Path.GFX + this.mPerksToImageDict[perkID].locked);
		}
		perkImage.unbindTooltip();
		perkImage.bindTooltip({ contentType: 'ui-perk', entityId: brother[CharacterScreenIdentifier.Entity.Id], perkId: perkID });
		perkImageContainer.append(perkImage);
	}

	var buttonContainer = $('<div class="l-perk-button-container"/>');
	entry.append(buttonContainer)

	var buttonLayout = $('<div class="l-button"/>');
	buttonContainer.append(buttonLayout);
	
	var button = buttonLayout.createTextButton("load", function ()
    {
		var callback = function (data)
	    {
	    	self.mDataSource.updateBrother(data);
	    }
	    console.error("Called load function. Name of build : " + _data)
        self.mDataSource.notifyBackendLoadPerksFromName(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], _data, callback);
    }, '', 1)
	button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.list.load-perks-button" });

	buttonLayout = $('<div class="l-button"/>');
	buttonContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("copy code", function ()
    {
    	var callback = function (data)
        {
        	var code = data.code
            var contentContainer = self.mPopupDialog.findPopupDialogContentContainer();
	    	var inputFields = contentContainer.find('input');
	    	$(inputFields[0]).setInputText(code);
	    	$(inputFields[0]).select()
	    	document.execCommand('copy');
	    	$(inputFields[0]).setInputText("");
        }
        console.error("Called copy code in build function. Name of build : " + _data)
        self.mDataSource.notifyBackendCopyPerksFromName(_data, callback);
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.list.copy-perks-button" });

	buttonLayout = $('<div class="l-button"/>');
	buttonContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("delete", function ()
    {
		var callback = function (data)
	    {
	    	self.mDataSource.notifyBackendLoadSavedPerks()
	    }
	    console.error("Called delete function. Name of build : " + _data)
        self.mDataSource.notifyBackendDeletePerks(_data, callback);
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.list.delete-perks-button" });

    var totalResult = {
    	div: result,
    	numOfMatchingPerks : numPerks
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

CharacterScreenPerksModule.prototype.initPerkTree = function (_perkTree, _perksUnlocked, _selectedPerks)
{
	this.mPerksToImageDict = {}
	var perkPointsSpent = this.mDataSource.getBrotherPerkPointsSpent(this.mDataSource.getSelectedBrother());
	var idx = 0;
	for (var row = 0; row < _perkTree.length; ++row)
	{
		for (var i = 0; i < _perkTree[row].length; ++i)
		{

			var perk = _perkTree[row][i];
			this.mPerksToImageDict[perk.ID] = {
				unlocked : perk.Icon,
				locked : perk.IconDisabled
			}

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
    this.resetPerkTree(this.mPerkTree);

    if (CharacterScreenIdentifier.Perk.Key in _brother)
    {
        this.initPerkTree(this.mPerkTree, _brother[CharacterScreenIdentifier.Perk.Key], _brother["selectedPerks"]);
    }

    if (CharacterScreenIdentifier.Entity.Id in _brother)
    {
        this.setupPerkTreeTooltips(this.mPerkTree, _brother[CharacterScreenIdentifier.Entity.Id]);
    }
};

CharacterScreenDatasource.prototype.notifyBackendUpdateSelectedPerk = function(_brother, _perkID, _bool, _callback)
{
	SQ.call(this.mSQHandle, 'onUpdateSelectedPerk', [_brother, _perkID, _bool], _callback);

}


CharacterScreenDatasource.prototype.notifyBackendClearPerksButtonClicked = function(_brother, _callback)
{

	SQ.call(this.mSQHandle, 'onClearSelectedPerks', [_brother], _callback);

}

CharacterScreenDatasource.prototype.notifyBackendSaveCurrentPerks = function(_brother, _perkName, _callback)
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
	SQ.call(this.mSQHandle, 'onLoadAllSelectedPerks', [], callback);
}
CharacterScreenDatasource.prototype.loadAllPerkBuilds = function(_data)
{	
	this.mSavedPerkBuilds = _data["perks"]
	this.notifyEventListener('perks.saved-list-loaded', _data["perks"]);
}

CharacterScreenDatasource.prototype.notifyBackendLoadPerksFromName = function(_brother, _perkBuildID, _callback)
{

	SQ.call(this.mSQHandle, 'onLoadSelectedPerksFromName', [_brother, _perkBuildID], _callback);
}

CharacterScreenDatasource.prototype.notifyBackendLoadPerksFromCode = function(_brother, _code, _callback)
{

	SQ.call(this.mSQHandle, 'onLoadSelectedPerksFromCode', [_brother, _code], _callback);
}


CharacterScreenDatasource.prototype.notifyBackendCopyPerksFromName = function(_perkBuildID, _callback)
{
	SQ.call(this.mSQHandle, 'onCopyPerksFromName', [_perkBuildID], _callback);
}
CharacterScreenDatasource.prototype.notifyBackendCopyCurrentPerks = function(_brother, _callback)
{

	SQ.call(this.mSQHandle, 'onCopyCurrentPerks', [_brother], _callback);
}
CharacterScreenDatasource.prototype.notifyBackendDeletePerks = function(_perkBuildID, _callback)
{

	SQ.call(this.mSQHandle, 'onDeletePerks', [_perkBuildID], _callback);
}
