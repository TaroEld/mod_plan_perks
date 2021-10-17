


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

			if (_selectedPerks[idx] == 1 && !perk.Unlocked){
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

CharacterScreenDatasource.prototype.notifyBackendUpdateSelectedPerk = function(_brother, _perk, _bool, _callback)
{
	SQ.call(this.mSQHandle, 'onUpdateSelectedPerk', [_brother, _perk, _bool], _callback);

}


