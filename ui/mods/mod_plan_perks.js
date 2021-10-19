
/*var CharacterScreenPerksModule = function(_parent, _dataSource)
{
    this.mParent = _parent;
    this.mDataSource = _dataSource;

	// container
	this.mContainer = null;

    this.mLeftColumn = null;
    this.mMiddleColumn = null;
    this.mRightColumn = null;

    // perks
    this.mPerkTree = null;
    this.mPerkRows = [];

    // buttons
    this.mPerkPlanningPanel = null;
    this.mPerkPlanningContainer = null;
    this.mResetPlannedPerksButton = null;
    this.mSavePerksButton = null;
    this.mLoadPerksButton = null;

    this.registerDatasourceListener();
};*/
CharacterScreenPerksModule.prototype.createDIV = function (_parentDiv)
{
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

    var layout = $('<div class="l-button is-all-filter"/>');
    this.mPerkPlanningPanel.append(layout);
    this.mSavePerksButton = layout.createImageButton(Path.GFX + Asset.BUTTON_ALL_FILTER, function ()
    {
        self.showSavePerksDialog();
    }, '', 3);

    var layout = $('<div class="l-button is-weapons-filter"/>');
    this.mPerkPlanningPanel.append(layout);
    this.mLoadPerksButton = layout.createImageButton(Path.GFX + Asset.BUTTON_WEAPONS_FILTER, function ()
    {
        self.showLoadPerksDialog();
    }, '', 3);
    
};

CharacterScreenPerksModule.prototype.showLoadPerksDialog = function()
{
    this.mDataSource.notifyBackendPopupDialogIsVisible(true);
    var self = this;
    var popupDialog = $('.character-screen').createPopupDialog('Load Perks', null, null, 'load-perks-popup');
    popupDialog.addPopupDialogContent(this.createLoadPerksDialogContent(popupDialog));
    popupDialog.addPopupDialogCancelButton(function (_dialog)
    {
        _dialog.destroyPopupDialog();
        self.mDataSource.notifyBackendPopupDialogIsVisible(false);
    });


};

/*
CharacterScreenPerksModule.prototype.showLoadPerksDialog = function()
{
    this.mDataSource.notifyBackendPopupDialogIsVisible(true);
    var self = this;
    var popupDialog = $('.character-screen').createPopupDialog('Load Perks', null, null, 'load-perks-popup');
    popupDialog.addPopupDialogContent(this.createLoadPerksDialogContent(popupDialog));
    popupDialog.addPopupDialogCancelButton(function (_dialog)
    {
        _dialog.destroyPopupDialog();
        self.mDataSource.notifyBackendPopupDialogIsVisible(false);
    });


};*/

CharacterScreenPerksModule.prototype.showSavePerksDialog = function()
{
    this.mDataSource.notifyBackendPopupDialogIsVisible(true);

    var self = this;
    var popupDialog = $('.character-screen').createPopupDialog('Save Perks', null, null, 'save-perks-popup');
    
   
    
    popupDialog.addPopupDialogButton('Save', 'l-ok-button', jQuery.proxy(function (_dialog)
    {
    	var contentContainer = _dialog.findPopupDialogContentContainer();
    	var inputFields = contentContainer.find('input');
    	self.mDataSource.notifyBackendSaveCurrentPerks(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], $(inputFields[0]).getInputText());
        _dialog.destroyPopupDialog();
        self.mDataSource.notifyBackendPopupDialogIsVisible(false);
    }, this));

    popupDialog.addPopupDialogCancelButton(function (_dialog)
    {
        _dialog.destroyPopupDialog();
        self.mDataSource.notifyBackendPopupDialogIsVisible(false);
    });

     popupDialog.addPopupDialogContent(this.createSavePerksDialogContent(popupDialog));
};

CharacterScreenPerksModule.prototype.createSavePerksDialogContent = function (_dialog)
{

    var result = $('<div class="save-perks-container"/>');
    // create & set name
    var row = $('<div class="row"/>');
    result.append(row);
    var label = $('<div class="label text-font-normal font-color-label font-bottom-shadow">Name</div>');
    row.append(label);

	var self = this;

    var inputLayout = $('<div class="l-input"/>');
    row.append(inputLayout);
    var inputField = inputLayout.createInput('', 0, 9999, 1, function (_input)
	{
        _dialog.findPopupDialogOkButton().enableButton(_input.getInputTextLength() >= Constants.Game.MIN_BROTHER_NAME_LENGTH);
    }, 'title-font-big font-bold font-color-brother-name', function (_input)
	{
		var button = _dialog.findPopupDialogOkButton();
		if(button.isEnabled())
		{
			button.click();
		}
	});
    return result;
};

CharacterScreenPerksModule.prototype.createLoadPerksDialogContent = function (_dialog)
{


    var result = $('<div class="save-and-load-perks-popup"/>');
	var self = this;

	var savePerksContainer = $('<div class="save-perks-from-code-container"/>');
	result.append(savePerksContainer)
	var loadPerksContainer = $('<div class="load-perks-from-code-container"/>');
	result.append(loadPerksContainer)

	//load one perk build
    var inputLayout = $('<div class="l-input"/>');
    loadPerksContainer.append(inputLayout);
    var inputCodeField = inputLayout.createInput('', 0, 9999, 1, function (_input)
	{
    }, 'title-font-big font-bold font-color-brother-name', function (_input)
	{
	});


	var buttonLayout = $('<div class="l-button"/>');
	loadPerksContainer.append(buttonLayout);
	
	var button = buttonLayout.createTextButton("load one perk", function ()
    {

	    var contentContainer = _dialog.findPopupDialogContentContainer();
	    var inputFields = contentContainer.find('input');
		console.error($(inputFields[0]).getInputText())
        self.mDataSource.notifyBackendLoadPerks(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], $(inputFields[0]).getInputText());
        //_dialog.destroyPopupDialog();
        self.mDataSource.notifyBackendPopupDialogIsVisible(false);
    })

	//load all perk builds
    inputLayout = $('<div class="l-input"/>');
    loadPerksContainer.append(inputLayout);
    var inputAllCodesField = inputLayout.createInput('', 0, 9999, 1, function (_input)
	{
    }, 'title-font-big font-bold font-color-brother-name', function (_input)
	{
	});


	buttonLayout = $('<div class="l-button"/>');
	loadPerksContainer.append(buttonLayout);
	
	button = buttonLayout.createTextButton("load all perk")

	//scroll container
	var listContainerLayout = $('<div class="l-list-container"/>');
	result.append(listContainerLayout)
	var listScrollContainer = listContainerLayout.findListScrollContainer();

    return result;
    
};

CharacterScreenPerksModule.prototype.fillLoadPerksScrollContainer = function (_dialog){
	var perkBuilds = this.mDataSource.notifyBackendLoadSavedPerks()
	for(var idx = 0; idx < perkBuilds.length; idx++){
		var perkBuildName = perkBuilds[idx] //fix thix
		var row = $('<div class="row"/>');
		_dialog.append(row)
		var label = $('<div class="label text-font-normal font-color-label font-bottom-shadow">' + perkBuildName + '</div>');
		row.append(label);
		//load perk button
		var buttonLayout = $('<div class="l-ok-button"/>');
		row.append(buttonLayout);
		buttonLayout.createTextButton(_label, jQuery.proxy(function ()
			{
			    _callback(this);
			}, this), '', 1);
		//delete perk button
		var buttonLayout = $('<div class="l-ok-button"/>');
		row.append(buttonLayout);
		buttonLayout.createTextButton(_label, jQuery.proxy(function ()
			{
			    _callback(this);
			}, this), '', 1);
	}
	return result

}
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
        		if(!_perk.Unlocked){
        			selectionLayer.attr('src', Path.GFX + Asset.PERK_SELECTION_FRAME);
        			selectionLayer.removeClass('display-block').addClass('display-none');
        			self.mDataSource.notifyBackendUpdateSelectedPerk(self.mDataSource.getSelectedBrother()[CharacterScreenIdentifier.Entity.Id], _perk.ID, 0, callback)
        		}
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
				{
					perk.Unlocked = true;

					perk.Image.attr('src', Path.GFX + perk.Icon);

					var selectionLayer = perk.Container.find('.selection-image-layer:first');
					selectionLayer.removeClass('display-none').addClass('display-block');

					break;
				}
			}

			if (perk.ID in _selectedPerks && !perk.Unlocked){
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

CharacterScreenDatasource.prototype.notifyBackendSaveCurrentPerks = function(_brother, _perkName)
{

	SQ.call(this.mSQHandle, 'onSaveSelectedPerks', [_brother, _perkName]);
}
CharacterScreenDatasource.prototype.notifyBackendLoadSavedPerks = function()
{

	var result = SQ.call(this.mSQHandle, 'onLoadAllSelectedPerks', []);
	return result
}
CharacterScreenDatasource.prototype.notifyBackendLoadPerks = function(_brother, _perks, _callback)
{

	SQ.call(this.mSQHandle, 'onLoadSelectedPerks', [_brother, _perks], _callback);
}

CharacterScreenDatasource.prototype.notifyBackendLoadPerksFromCode = function(_brother, _code, _callback)
{

	SQ.call(this.mSQHandle, 'onLoadSelectedPerksFromCode', [_brother, _perks], _callback);
}
