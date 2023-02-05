var ModPlanPerks = {
	PlannedPerkStatus : {
    	Unplanned : 1,
    	Planned : 2,
    	Temporary : 3,
    	Forbidden : 4
	},
	PlannedPerkColorData : {},
}



// HOOKED FUNCTIONS --------------------------------------------------------------------------------------------------------------------

var loadPerkTreesWithBrotherData = CharacterScreenPerksModule.prototype.loadPerkTreesWithBrotherData
CharacterScreenPerksModule.prototype.loadPerkTreesWithBrotherData = function (_brother)
{
	loadPerkTreesWithBrotherData.call(this, _brother);
	if(this.mPerksToImageDict === undefined)
		return;
	this.updatePerkToImageDict();
	this.initPlannedPerksInTree(_brother);
};

CharacterScreenPerksModule.prototype.updatePerkToImageDict = function()
{
	var self = this;
	$.each(this.mPerksToImageDict, function(_id, _perk)
	{
		self.mPerksToImageDict[_id].hasPerkInTree = false;
	})
	for (var row = 0; row < this.mPerkTree.length; ++row)
	{
		for (var i = 0; i < this.mPerkTree[row].length; ++i)
		{
			var perk = this.mPerkTree[row][i];
			this.mPerksToImageDict[perk.ID].hasPerkInTree = true;
		}
	}
}

var attachEventHandler = CharacterScreenPerksModule.prototype.attachEventHandler
CharacterScreenPerksModule.prototype.attachEventHandler = function(_perk)
{
	var self = this;
	attachEventHandler.call(this, _perk);
	var perkPlannedImage = $('<div class="planned-image-layer"/>');
	_perk.Container.append(perkPlannedImage);
	var perkPlannedOverlay = $('<div class="planned-image-overlay"/>');
	_perk.Container.append(perkPlannedOverlay);
	_perk.Container.mousedown(function (_event)
	{
		if (event.which === 3)
        {
		    var ctrlPressed = (KeyModiferConstants.CtrlKey in _event && _event[KeyModiferConstants.CtrlKey] === true);
		    var maxToggle = ModPlanPerks.PlannedPerkStatus.Forbidden;
		    if (MSU.getSettingValue("mod_plan_perks", "disable_other_states"))
		    	maxToggle = ModPlanPerks.PlannedPerkStatus.Planned;
        	var newMode = _perk.PlannedStatus + 1
        	if (newMode > maxToggle || ctrlPressed) newMode = ModPlanPerks.PlannedPerkStatus.Unplanned;
        	_perk.PlannedStatus = newMode;
        	self.mDataSource.notifyBackendUpdatePlannedPerk(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], _perk.ID, _perk.PlannedStatus, self)
        }
	});
}

var create = CharacterScreenPerksModule.prototype.create
CharacterScreenPerksModule.prototype.create = function(_parentDiv)
{
    create.call(this, _parentDiv);
    this.createPerkMenuButtons(_parentDiv);
};

var destroyDIV = CharacterScreenPerksModule.prototype.destroyDIV
CharacterScreenPerksModule.prototype.destroyDIV = function ()
{
	this.mPerkPlanningPanel = null;
	this.mResetPlannedPerksButton.remove()
	this.mResetPlannedPerksButton = null;

	this.mSavePerksButton.remove()
	this.mSavePerksButton = null;

	this.mPlanPerksButtonsPanel.empty();
    this.mPlanPerksButtonsPanel.remove();
    this.mPlanPerksButtonsPanel = null;

    this.mPerkCountPanel.empty();
    this.mPerkCountPanel.remove();
    this.mPerkCountPanel = null;

    destroyDIV.call(this)
};

var show = CharacterScreenPerksModule.prototype.show
CharacterScreenPerksModule.prototype.show = function ()
{
    show.call(this)
    if (this.mPlanPerksButtonsPanel !== undefined && this.mPlanPerksButtonsPanel !== null)
    {
    	this.mPlanPerksButtonsPanel.removeClass('display-none').addClass('display-block');
    }
    if (this.mPerkCountPanel !== undefined && this.mPerkCountPanel !== null)
    {
    	this.mPerkCountPanel.removeClass('display-none').addClass('display-block');
    }
};

var hide = CharacterScreenPerksModule.prototype.hide
CharacterScreenPerksModule.prototype.hide = function ()
{
    hide.call(this);
    if (this.mPlanPerksButtonsPanel !== undefined && this.mPlanPerksButtonsPanel !== null)
    {
    	this.mPlanPerksButtonsPanel.removeClass('display-block').addClass('display-none');
    }

    if (this.mPerkCountPanel !== undefined && this.mPerkCountPanel !== null)
    {
    	this.mPerkCountPanel.removeClass('display-block').addClass('display-none');
    }
};

var PlanPerks_CharacterScreen_show = CharacterScreen.prototype.show;
CharacterScreen.prototype.show = function(_outerData)
{
	var self = this;
	var perksmodule = self.mRightPanelModule.mPerksModule;
	if (perksmodule.mPerksToImageDict === undefined)
	{
	    var callback = function(_data){
			perksmodule.mPerksToImageDict = {};
			if (_data.Legends)
			{
				perksmodule.initPerkToImageDictLegends(_data.PerkDefObjects)
			}
		    else if (_data.DPF){
		    	perksmodule.initPerkToImageDictDPF(_data.LookupMap)
		    }
		    else {
		    	perksmodule.initPerkToImageDictVanilla(_data.VanillaLookupMap)
		    }
	    	PlanPerks_CharacterScreen_show.call(self, _outerData);
	    }
	    SQ.call(this.mSQHandle, 'onQuerySpecialSnowflakeMods', [], callback);
	}
	else
	{
		PlanPerks_CharacterScreen_show.call(self, _outerData);
	}
};

// DIV CREATION FUNCTIONS ---------------------------------------------------------------------------------------------------------------------------------------------------------

//buttons to reset and open the popup, listeners
CharacterScreenPerksModule.prototype.createPerkMenuButtons = function (_parentDiv)
{
	if(!("perks.saved-list-loaded" in this.mDataSource.mEventListener))
	{
		this.mDataSource.mEventListener['perks.saved-list-loaded'] = [ ];
		this.mDataSource.addListener('perks.saved-list-loaded', jQuery.proxy(this.setupPerkBuildList, this));
		this.mDataSource.addListener(CharacterScreenDatasourceIdentifier.Brother.Selected, jQuery.proxy(this.updateDynamicContent, this));
		this.mDataSource.addListener(CharacterScreenDatasourceIdentifier.Brother.Updated, jQuery.proxy(this.updateDynamicContent, this));
	}

	var self = this;
    this.mPlanPerksButtonsPanel = $('<div class="mod-plan-perks-button-panel"/>');
    //this.mContainer.append(this.mParentPanel);
    $('.right-panel-header-module').append(this.mPlanPerksButtonsPanel)

    var layout = $('<div class="l-button is-sort"/>');
    this.mPlanPerksButtonsPanel.append(layout);
    this.mResetPlannedPerksButton = layout.createImageButton(Path.GFX + "ui/buttons/reset_planned_perks.png", function ()
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
    });
    this.mResetPlannedPerksButton.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.clear-perks-button" });

    var layout = $('<div class="l-button is-all-filter"/>');
    this.mPlanPerksButtonsPanel.append(layout);
    this.mSavePerksButton = layout.createImageButton(Path.GFX + "ui/buttons/open_save_menu.png", function ()
    {
        self.showSaveAndLoadPerksDialog();
    });
    this.mSavePerksButton.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.save-perks-button" });
    
    this.mPerkCountPanel = $('<div class="perk-count-panel"/>');
    _parentDiv.append(this.mPerkCountPanel);
    var rosterSizeImage = $('<img/>');
    rosterSizeImage.attr('src', Path.GFX + 'ui/perks/perks_planning.png');
    this.mPerkCountPanel.append(rosterSizeImage);
    this.mPerkCountLabel = $('<div class="label text-font-small font-bold font-color-value"/>');
    this.mPerkCountPanel.append(this.mPerkCountLabel);
    this.mPerkCountPanel.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.perk-num-label" });
    
};

CharacterScreenPerksModule.prototype.updatePerkCountLabel = function ()
{
    this.mPerkCountLabel.html('' + this.getCurrentlyPlannedPerks());
};

CharacterScreenPerksModule.prototype.showSaveAndLoadPerksDialog = function()
{
    this.mDataSource.notifyBackendPopupDialogIsVisible(true);
    var self = this;
    this.mPopupDialog = $('.character-screen').createPopupDialog('Save and Load Perk Builds', null, null, 'save-and-load-perks-popup');
    this.mPopupDialog.addPopupDialogContent(this.createSaveAndLoadPerksDialogContent(this.mPopupDialog));
    this.createScrollContainer()
    this.mPopupDialog.addPopupDialogButton('Cancel', 'l-cancel-button', function (_dialog)
   {
       self.mDataSource.notifyBackendPopupDialogIsVisible(false);
       self.mPopupDialog.destroyPopupDialog();
   })

};

CharacterScreenPerksModule.prototype.createCurrentCharacterContainer = function ()
{
	var self = this;
	this.mCurrentCharacterContainer = $('<div class="current-character-container"/>');
	this.mBrotherNameContainer = $('<div class="name-container"/>')
		.appendTo(this.mCurrentCharacterContainer)
		.html($('.character-screen-container .left-panel-header-module .name-container').html());

	var leftColumn = $('<div class="column-left"/>');
	
	this.mCurrentCharacterContainer.append(leftColumn)

	this.mPortraitContainer =  $('<div class="perk-portrait-container"/>')
		.appendTo(leftColumn)
	this.mPortraitImage = $('.character-screen-container .left-panel-header-module .portrait-container').find("img").eq(1).clone()
		.appendTo(this.mPortraitContainer)


	this.mSwitchBrotherContainer = $('<div class="switch-brother-button-container"/>');
	leftColumn.append(this.mSwitchBrotherContainer)

	buttonLayout = $('<div class="l-button"/>');
	this.mSwitchBrotherContainer.append(buttonLayout);
	button = buttonLayout.createImageButton(Path.GFX + "ui/buttons/switch_previous_brother.png", function ()
    {
    	self.mDataSource.modPerkSwitchPreviousBrother();
    }, "", 3);
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.switch-previous-brother-button" });

	buttonLayout = $('<div class="l-button"/>');
	this.mSwitchBrotherContainer.append(buttonLayout);
	button = buttonLayout.createImageButton(Path.GFX + "ui/buttons/switch_next_brother.png", function ()
    {
    	self.mDataSource.modPerkSwitchNextBrother();
    }, "", 3);
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.switch-next-brother-button" });

    // divier

    var divider = $('<div class="divider-vertical"/>');
    this.mCurrentCharacterContainer.append(divider)

    //right column--------------------------------------------------------------------------------------------------------------------------------------------
	var rightColumn = $('<div class="column-right"/>');
	this.mCurrentCharacterContainer.append(rightColumn)
	this.mUnlockedPerksContainer = $('<div class="unlocked-perks-container"/>');
	rightColumn.append(this.mUnlockedPerksContainer)
	var textLabel = $('<div class="event-text text-font-medium font-color-title font-style-normal">Current Perks</div>');
  	this.mUnlockedPerksContainer.append(textLabel);
  	this.mUnlockedPerksImageContainer = $('<div class="unlocked-perks-image-container"/>');
  	this.mUnlockedPerksContainer.append(this.mUnlockedPerksImageContainer)

	this.mPlannedPerksContainer = $('<div class="planned-perks-container"/>');
	rightColumn.append(this.mPlannedPerksContainer)
	textLabel = $('<div class="event-text text-font-medium font-color-title font-style-normal">Planned Perks</div>');
	this.mPlannedPerksContainer.append(textLabel)
	this.mPlannedPerksImageContainer = $('<div class="planned-perks-image-container"/>');
	this.mPlannedPerksContainer.append(this.mPlannedPerksImageContainer)
	this.fillPerkImageContainers()
	return this.mCurrentCharacterContainer
}

CharacterScreenPerksModule.prototype.fillPerkImageContainers = function ()
{
	var brother = this.mDataSource.getSelectedBrother()
	this.mPlannedPerksImageContainer.empty()
	this.mUnlockedPerksImageContainer.empty()
	for (var row = 0; row < this.mPerkTree.length; ++row)
	{
		for (var i = 0; i < this.mPerkTree[row].length; ++i)
		{
			var perk = this.mPerkTree[row][i];
			var perkImage = $('<img class="perk-image"/>');
			perkImage.attr('src', Path.GFX + this.mPerksToImageDict[perk.ID].locked);
			perkImage.unbindTooltip();
			perkImage.bindTooltip({ contentType: 'ui-perk', entityId: brother[CharacterScreenIdentifier.Entity.Id], perkId: perk.ID });
			if (perk.Unlocked){
				perkImage.attr('src', Path.GFX + this.mPerksToImageDict[perk.ID].unlocked);
				var img = perkImage.clone()
				img.unbindTooltip();
				img.bindTooltip({ contentType: 'ui-perk', entityId: brother[CharacterScreenIdentifier.Entity.Id], perkId: perk.ID });
				this.mUnlockedPerksImageContainer.append(img)
			}
			if (perk.PlannedStatus == ModPlanPerks.PlannedPerkStatus.Planned){
				this.mPlannedPerksImageContainer.append(perkImage)
			}
		}
	}
}

CharacterScreenPerksModule.prototype.updateDynamicContent = function (_dataSource, _brother)
{
	//updates the content that depends on the specific bro, called by event listener on update/switeched bro and during setup
	var self = this;
	if (this.mPopupDialog === undefined || this.mPopupDialog === null) return
	this.mListScrollContainer.empty()
	this.mDataSource.notifyBackendLoadSavedPerks()
	
	this.mPortraitContainer.empty()

	this.mBrotherNameContainer.html($('.character-screen-container .left-panel-header-module .name-container').html())
	//otherwise images are wrong, dimensions or wrong brother
	setTimeout(function(){
		self.mPortraitImage = $('.character-screen-container .left-panel-header-module .portrait-container').find("img").eq(1).clone()
		self.mPortraitContainer.append(self.mPortraitImage)
		self.fillPerkImageContainers()
	}, 25)
	
}

CharacterScreenPerksModule.prototype.createSaveAndLoadPerksDialogContent = function (_dialog)
{
    var result = $('<div class="save-and-load-perk-popup-content-container"/>');
    _dialog.append(result);
	var self = this;

	var topDivider = $('<div class="divider-horizontal above-save-perk"/>');
	result.append(topDivider)

	//SAVE PERK BUILDS DIV -------------------------------------------------------------------------------------------------------------------------------------------------
	var savePerksContainer = $('<div class="save-perk-builds-container"/>');
	result.append(savePerksContainer)

	var savePerksFromCodeContainer = $('<div class="save-perks-from-code-container"/>');
	savePerksContainer.append(savePerksFromCodeContainer)
	result.append(this.createCurrentCharacterContainer())

	var header = $('<div class="header has-no-sub-title"/>');
	savePerksFromCodeContainer.append(header);
	var titleTextContainer = $('<div class="text-container"/>');
	header.append(titleTextContainer);
	var title = $('<div class="title title-font-big font-bold font-bottom-shadow font-color-title">Save Perk Builds</div>');
	titleTextContainer.append(title)

	//input name for current build, disables the save perks button if empty
    var inputLayout = $('<div class="l-input"/>');
    savePerksFromCodeContainer.append(inputLayout);
    var inputField = inputLayout.createInput('', 0, 9999, 1, function (_input)
	{
        _dialog.find('.save-perks-button').enableButton((_input.getInputTextLength() >= Constants.Game.MIN_BROTHER_NAME_LENGTH) && (self.getCurrentlyPlannedPerks() > 0) && self.checkForDelimiters(_input.getInputText()));
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
        self.mDataSource.notifyBackendSavePlannedPerks(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], $(inputFields[0]).getInputText(), callback);
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

    buttonLayout = $('<div class="l-button"/>');
    savePerksFromCodeContainer.append(buttonLayout)
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
    

    var midDivider = $('<div class="divider-horizontal between-perk"/>');
    result.append(midDivider)

    //LOAD PERKS DIV -----------------------------------------------------------------------------------------------------------------------------------------

	this.mLoadPerkBuildsContainer = $('<div class="load-perk-builds-container"/>');
	result.append(this.mLoadPerkBuildsContainer);

	//header
	header = $('<div class="header has-no-sub-title"/>');
	this.mLoadPerkBuildsContainer.append(header);
	titleTextContainer = $('<div class="text-container"/>');
	header.append(titleTextContainer);
	title = $('<div class="title title-font-big font-bold font-bottom-shadow font-color-title">Load Perk Builds</div>');
	titleTextContainer.append(title)

	var loadPerksFromCodeContainer = $('<div class="load-perks-from-code-container"/>');
	this.mLoadPerkBuildsContainer.append(loadPerksFromCodeContainer)
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
        self.mDataSource.notifyBackendApplyPerkBuildFromString(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], $(inputFields[1]).getInputText(), overrideToggle, callback);
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
        self.mDataSource.notifyBackendImportPerkBuildsFromString($(inputFields[1]).getInputText(), callback);
    }, '', 1)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.load-all-builds-button" });



    var botDivider = $('<div class="divider-horizontal below-load-perk"/>');
    result.append(botDivider)

	//Container for filter bar and scrolling list -----------------------------------------------------------------------


	this.mPerkBuildListContainer = $('<div class="perk-build-list-container"/>');
	result.append(this.mPerkBuildListContainer)
	var filterBarHeader = $('<div class="sort-bar-header title title-font-big font-bold font-bottom-shadow font-color-title">Sort By:</div>')
		.appendTo(this.mPerkBuildListContainer);
	var filterBarContainer = $('<div class="sort-bar-container"/>');
	this.mPerkBuildListContainer.append(filterBarContainer)
	var filterBarButtonsContainer = $('<div class="sort-bar-button-container"/>');
	filterBarContainer.append(filterBarButtonsContainer)

	buttonLayout = $('<div class="l-button"/>');
	filterBarButtonsContainer.append(buttonLayout);
	button = buttonLayout.createTextButton("Missing Perks", function ()
    {
    	if (self.mSortingFunction == "byMissingPerks") self.mSortingFunction = "byMissingPerksReverse"
    	else self.mSortingFunction = "byMissingPerks"
		self.mDataSource.notifyBackendLoadSavedPerks()
    }, '', 4)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.sort-by-missing-button" });

	buttonLayout = $('<div class="l-button"/>');
	filterBarButtonsContainer.append(buttonLayout);
	button = buttonLayout.createTextButton("Alphabetically", function ()
    {
    	if (self.mSortingFunction == "byAlphabetical") self.mSortingFunction = "byAlphabeticalReverse"
    	else self.mSortingFunction = "byAlphabetical"
		self.mDataSource.notifyBackendLoadSavedPerks()
    }, '', 4)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.sort-alphabetically-button" });

	buttonLayout = $('<div class="l-button"/>');
	filterBarButtonsContainer.append(buttonLayout);
	button = buttonLayout.createTextButton("Unlocked Perks", function ()
    {
    	if (self.mSortingFunction == "byMatchingPerks") self.mSortingFunction = "byMatchingPerksReverse"
    	else self.mSortingFunction = "byMatchingPerks"
		self.mDataSource.notifyBackendLoadSavedPerks()
    }, '', 4)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.sort-by-matching-button" });

    var toggleOverrideContainer = $('<div class="override-container"/>');
    filterBarButtonsContainer.append(toggleOverrideContainer);

    this.mOverrideToggle = $('<input type="checkbox" id="override-toggle"/>');
    toggleOverrideContainer.append(this.mOverrideToggle);
    this.mOverrideToggle.iCheck(
    {
        checkboxClass: 'icheckbox_flat-orange',
        radioClass: 'iradio_flat-orange',
        increaseArea: '30%'
    }, '', 1)
    this.mOverrideToggle.iCheck('check')

    var overrideLabel = $('<label class="text-font-normal font-color-subtitle" for="override-toggle">Override planned perks</label>');
    toggleOverrideContainer.append(overrideLabel);
    overrideLabel.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.override-perks-toggle" });
    
    return result;
};

CharacterScreenPerksModule.prototype.createScrollContainer = function()
{
	var listContainerLayout = $('<div class="l-list-container"/>');
	this.mPerkBuildListContainer.append(listContainerLayout);
	this.mListContainer = listContainerLayout.createList(2);	
	this.mListScrollContainer = this.mListContainer.findListScrollContainer();
	this.mSortingFunction = "byAlphabetical"
	this.mDataSource.notifyBackendLoadSavedPerks()
}

CharacterScreenPerksModule.prototype.setupPerkBuildList = function(_datasource, _data)
{
	if (this.mListScrollContainer === undefined){
		return
	}
	this.mListScrollContainer.empty()

	var brother = this.mDataSource.getSelectedBrother()

	var divResultList = []
	
	for (var key in _data){
	  divResultList.push(this.addListEntryToPerkBuildList(key))
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
}

CharacterScreenPerksModule.prototype.addListEntryToPerkBuildList = function (_data)
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
	var name = $('<div class="perk-name">' + _data + '</div>');
	nameContainer.append(name);
	var perkImagesContainer = $('<div class="l-perk-images-container"/>');
	entry.append(perkImagesContainer);
	var currentLeft = 0;
	Object.keys(perkBuild).forEach(function(_key){
		var perkID = _key
		var isPlanned = perkBuild[_key]
		if (isPlanned != ModPlanPerks.PlannedPerkStatus.Planned){
			return
		}
		var isUnlocked = isPerkUnlocked(brotherPerks, perkID)
		var hasPerkInList = this.mPerksToImageDict[perkID].hasPerkInTree
		var perkImageContainer = $('<div class="perk-image-container"/>');
		perkImagesContainer.append(perkImageContainer);

		var perkImage = $('<img class="perk-image"/>');
		perkImageContainer.append(perkImage);
		perkImage.attr('src', Path.GFX + this.mPerksToImageDict[perkID].locked);
		if (isUnlocked === true){
			perkImage.attr('src', Path.GFX + this.mPerksToImageDict[perkID].unlocked);
			numPerks++
		}
		perkImage.unbindTooltip();
		perkImage.bindTooltip({ contentType: 'ui-perk', entityId: brother[CharacterScreenIdentifier.Entity.Id], perkId: perkID });

		var perkOverlayImage = $('<img class="perk-image-overlay display-none"/>');
		perkImageContainer.append(perkOverlayImage);
		perkOverlayImage.attr('src', Path.GFX + 'ui/perks/missing-from-perks.png');
		if(hasPerkInList === false){
			numMissingPerkInList++
			perkOverlayImage.removeClass("display-none").addClass("display-block");
		}

		currentLeft += 3;

	}.bind(this))
	for (var x = 0; x < perkBuild.length; x++){

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
        self.mDataSource.notifyBackendStringifyPerkBuildFromName(_data, callback);
    }, '', 2)
    button.bindTooltip({ contentType: 'ui-element', elementId: "mod-plan-perks.menu.list.copy-perks-button" });

	buttonLayout = $('<div class="l-button"/>');
	buttonContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("Delete", function ()
    {
		var callback = function (data)
	    {
	    	self.mDataSource.notifyBackendLoadSavedPerks();
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

CharacterScreenPerksModule.prototype.getCurrentlyPlannedPerks = function()
{
	var numPlanned = 0;
	for (var row = 0; row < this.mPerkTree.length; ++row)
	{
		for (var i = 0; i < this.mPerkTree[row].length; ++i)
		{
			var perk = this.mPerkTree[row][i];
			if (perk.PlannedStatus == ModPlanPerks.PlannedPerkStatus.Planned) numPlanned++
		}
	}
	return numPlanned
}

CharacterScreenPerksModule.prototype.checkForDelimiters = function(_string){
	//search uses regex so escape dollar
	//somehow doesn't update instantly for # oh well
	return (_string.search("[°~$#]") ==  -1)
}


CharacterScreenPerksModule.prototype.updatePerkToImageDict = function()
{
	var self = this;
	$.each(this.mPerksToImageDict, function(_id, _perk)
	{
		self.mPerksToImageDict[_id].hasPerkInTree = false;
	})
	for (var row = 0; row < this.mPerkTree.length; ++row)
	{
		for (var i = 0; i < this.mPerkTree[row].length; ++i)
		{
			var perk = this.mPerkTree[row][i];
			this.mPerksToImageDict[perk.ID].hasPerkInTree = true;
		}
	}
}

CharacterScreenPerksModule.prototype.initPerkToImageDictVanilla = function (_perkTree)
{
	for (var row = 0; row < _perkTree.length; ++row)
	{
		for (var i = 0; i < _perkTree[row].length; ++i)
		{
			var perk = _perkTree[row][i];
			this.mPerksToImageDict[perk.ID] = {
				unlocked : perk.Icon,
				locked : perk.IconDisabled,
				hasPerkInTree: false
			}
		}
	}
}

CharacterScreenPerksModule.prototype.initPerkToImageDictDPF = function (_perkTree)
{
	var self = this;
	$.each(_perkTree, function(_id, _perk)
	{
		self.mPerksToImageDict[_id] = {
			unlocked : _perk.Icon,
			locked : _perk.IconDisabled,
			hasPerkInTree: false
		}
	})
}

CharacterScreenPerksModule.prototype.initPerkToImageDictLegends = function (_perkTree)
{
	for (var i = 0; i < _perkTree.length; ++i)
	{
		var perk = _perkTree[i];
		this.mPerksToImageDict[perk.ID] = {
			unlocked : perk.Icon,
			locked : perk.IconDisabled,
			hasPerkInTree: false
		}
	}
}

CharacterScreenPerksModule.prototype.updatePlanPerksColorSettings = function()
{
	var asRGBA = function(_values)
	{
		return "rgba(" + _values + ")"
	}
	ModPlanPerks.PlannedPerkColorData[2] = {
		"RGB" : asRGBA(MSU.getSettingValue("mod_plan_perks", "planned_picker")),
		"Overlay" : MSU.getSettingValue("mod_plan_perks", "planned_shadow")
	}
	ModPlanPerks.PlannedPerkColorData[3] = {
		"RGB" : asRGBA(MSU.getSettingValue("mod_plan_perks", "temporary_picker")),
		"Overlay" : MSU.getSettingValue("mod_plan_perks", "temporary_shadow")
	}
	ModPlanPerks.PlannedPerkColorData[4] = {
		"RGB" : asRGBA(MSU.getSettingValue("mod_plan_perks", "forbidden_picker")),
		"Overlay" : MSU.getSettingValue("mod_plan_perks", "forbidden_shadow")
	}
}

CharacterScreenPerksModule.prototype.updatePlannedPerkInTree = function (_perk, _brother)
{
	var selectionLayer = _perk.Container.find('.planned-image-layer:first');
	var selectionOverlay = _perk.Container.find('.planned-image-overlay:first');
	var brotherID = _brother[CharacterScreenIdentifier.Entity.Id]
	var plannedPerks = _brother["PlannedPerks"]
	if (_perk.ID in plannedPerks){
		_perk.PlannedStatus = plannedPerks[_perk.ID];
		// Failsave/fix
		if (!(_perk.PlannedStatus in ModPlanPerks.PlannedPerkColorData))
		{
			_perk.PlannedStatus = ModPlanPerks.PlannedPerkStatus.Unplanned;
			this.mDataSource.notifyBackendUpdatePlannedPerk(brotherID, _perk.ID, _perk.PlannedStatus, this)
		}
		selectionLayer.css("display", "block")
		selectionLayer.css("border", "2px solid " + ModPlanPerks.PlannedPerkColorData[_perk.PlannedStatus].RGB)
		selectionLayer.bindTooltip({ contentType: 'ui-perk', entityId: brotherID, perkId: _perk.ID });
		if (ModPlanPerks.PlannedPerkColorData[_perk.PlannedStatus].Overlay === false)
		{
			selectionOverlay.css("display", "none")
		}
		else
		{
			selectionOverlay.css("display", "block")
			selectionOverlay.css("background-color", ModPlanPerks.PlannedPerkColorData[_perk.PlannedStatus].RGB)
		}

	}
	else{
		_perk.PlannedStatus = ModPlanPerks.PlannedPerkStatus.Unplanned
		selectionLayer.css("display", "none")
		selectionOverlay.css("display", "none")
	}
	this.updatePerkCountLabel();
}

CharacterScreenPerksModule.prototype.initPlannedPerksInTree = function (_brother){
	this.updatePlanPerksColorSettings();
	var perk;
	for (var row = 0; row < this.mPerkTree.length; ++row)
	{
		for (var i = 0; i < this.mPerkTree[row].length; ++i)
		{
			perk = this.mPerkTree[row][i];
			this.updatePlannedPerkInTree(perk, _brother);
		}
	}
}

CharacterScreenPerksModule.prototype.findPerkByID = function(_perkID)
{
	var perk;
	for (var row = 0; row < this.mPerkTree.length; ++row)
	{
		for (var i = 0; i < this.mPerkTree[row].length; ++i)
		{
			perk = this.mPerkTree[row][i];
			if (perk.ID == _perkID)
				return perk;
		}
	}
}

CharacterScreenPerksModule.prototype.updatePlannedPerkByCallback = function(_data)
{

    if (_data === undefined || _data === null || typeof (_data) !== 'object')
    {
        console.error('ERROR: Failed to updatePerkByCallback. Invalid _data result.');
        return;
    }

    // check if we have an error
    if (ErrorCode.Key in _data)
    {
        this.notifyEventListener(ErrorCode.Key, _data[ErrorCode.Key]);
        return;
    }
    if(!("perkID" in _data) || !("brother" in _data) || !(CharacterScreenIdentifier.Entity.Id in _data.brother))
    {
    	console.error('ERROR: Failed to updatePerkByCallback. Invalid _data result.');
    	return;
    }
    var perk = this.findPerkByID(_data.perkID);
    if (perk == null)
    {
    	console.error("ERROR: Failed to updatePerkByCallback. Can't find perk with ID ."  + _data.perkID);
    	return;
    }

    this.updatePlannedPerkInTree(perk, _data.brother);
}

CharacterScreenDatasource.prototype.modPerkSwitchPreviousBrother = function(_withoutNotify)
{
    var currentIndex = this.mSelectedBrotherIndex;

    for (var i = this.mSelectedBrotherIndex - 1; i >= 0; --i)
    {
        if (this.mBrothersList[i] !== null)
        {
            this.mSelectedBrotherIndex = i;
            break;
        }
    }

    if (this.mSelectedBrotherIndex == currentIndex)
    {
        for (var i = this.mBrothersList.length - 1; i > currentIndex; --i)
        {
            if (this.mBrothersList[i] !== null)
            {
                this.mSelectedBrotherIndex = i;
                break;
            }
        }
    }

    // notify every listener
    if (_withoutNotify === undefined || _withoutNotify !== true)
    {
        this.notifyEventListener(CharacterScreenDatasourceIdentifier.Brother.Selected, this.getSelectedBrother());
    }
};

CharacterScreenDatasource.prototype.modPerkSwitchNextBrother = function(_withoutNotify)
{
    if (this.mBrothersList == null)
        return;

    var currentIndex = this.mSelectedBrotherIndex;

    for (var i = this.mSelectedBrotherIndex + 1; i < this.mBrothersList.length; ++i)
    {
        if (this.mBrothersList[i] !== null)
        {
            this.mSelectedBrotherIndex = i;
            break;
        }
    }

    if(this.mSelectedBrotherIndex == currentIndex)
    {  
        for (var i = 0; i < this.mSelectedBrotherIndex; ++i)
        {
            if (this.mBrothersList[i] !== null)
            {
                this.mSelectedBrotherIndex = i;
                break;
            }
        }
    }

    // notify every listener
	if (_withoutNotify === undefined || _withoutNotify !== true)
	{
		this.notifyEventListener(CharacterScreenDatasourceIdentifier.Brother.Selected, this.getSelectedBrother());
	}
};


//BACKEND QUERIES --------------------------------------------------------------------------------------------------------------------------------------------------

//update single planned perk for a specific brother after rightclicking
CharacterScreenDatasource.prototype.notifyBackendUpdatePlannedPerk = function(_brother, _perkID, _perkValue, _env)
{
	var callback = function(_data)
	{
		_env.updatePlannedPerkByCallback(_data);
	}
	SQ.call(this.mSQHandle, 'onUpdatePlannedPerk', [_brother, _perkID, _perkValue], callback);
}

//clear all planned perks for specific brother
CharacterScreenDatasource.prototype.notifyBackendClearPerksButtonClicked = function(_brother, _callback)
{
	SQ.call(this.mSQHandle, 'onClearPlannedPerks', [_brother], _callback);
}

//save planned perks of a brother as a new perk build
CharacterScreenDatasource.prototype.notifyBackendSavePlannedPerks = function(_brother, _perkName, _callback)
{
	SQ.call(this.mSQHandle, 'onSavePlannedPerks', [_brother, _perkName], _callback);
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
CharacterScreenDatasource.prototype.notifyBackendApplyPerkBuildFromString = function(_brother, _code, _override, _callback)
{

	SQ.call(this.mSQHandle, 'onApplyPerkBuildFromString', [_brother, _code, _override], _callback);
}

//import perk builds to the list with name
CharacterScreenDatasource.prototype.notifyBackendImportPerkBuildsFromString = function(_code, _callback)
{

	SQ.call(this.mSQHandle, 'onImportPerkBuildsFromString', [_code], _callback);
}

//export one perk build after pressing the export button
CharacterScreenDatasource.prototype.notifyBackendStringifyPerkBuildFromName = function(_perkBuildID, _callback)
{
	SQ.call(this.mSQHandle, 'onStringifyPerkBuildFromName', [_perkBuildID], _callback);
}

//copy currently planned perks as code
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
CharacterScreenDatasource.prototype.notifyBackendQueryForMods = function(_callback)
{
	SQ.call(this.mSQHandle, 'onQuerySpecialSnowflakeMods', [], _callback);
}

CharacterScreenDatasource.prototype.destroyPopupDialog = function()
{
	var popup = $(".ui-control.popup-dialog-dialog-modal-background")
	popup.destroyPopupDialog()
   	this.notifyBackendPopupDialogIsVisible(false);
}
