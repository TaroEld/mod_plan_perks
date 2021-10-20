local modName = "mod_plan_perks"
::mods_registerMod(modName, 1.0)
::mods_registerJS("mod_plan_perks.js");
::mods_registerCSS("mod_plan_perks.css");
::mods_queue(null, null, function()
{
	local gt = this.getroottable()


	::mods_hookNewObject("ui/global/data_helper", function(o){
		local convertEntityToUIData = o.convertEntityToUIData
		o.convertEntityToUIData = function(_entity, _activeEntity){
			local result = convertEntityToUIData(_entity, _activeEntity)
			result.selectedPerks <- this.addSelectedPerksToUIData(_entity)
			return result
		}

		o.addSelectedPerksToUIData <- function(_entity){
			local selectedPerksDict = {}
			foreach(key in _entity.getBackground().m.SelectedPerks){
				selectedPerksDict[key] <- 1
			}
			return selectedPerksDict
		}
	})

	::mods_hookNewObject("states/world_state", function(o){
		o.m.PerkBuilds <- null; 
		local onInitUI = o.onInitUI
		o.onInitUI = function(){
			onInitUI()
			this.m.PerkBuilds = this.new("scripts/states/world/perk_manager");
			this.World.Perks <- this.WeakTableRef(this.m.PerkBuilds);
		}
		local onSerialize = o.onSerialize	
		o.onSerialize = function(_out){
			onSerialize(_out)
			this.World.Perks.onSerialize(_out)
		}


		local onDeserialize = o.onDeserialize
		o.onDeserialize = function(_in){
			onDeserialize(_in)
			this.World.Perks.onDeserialize(_in)
		}

	})

	::mods_hookExactClass("skills/backgrounds/character_background", function(o){
		o.m.SelectedPerks <- []
		o.initSelectedPerks <- function(){
			this.m.SelectedPerks = []
			this.getContainer().getActor().getFlags().set("selectedPerks", true)
		}
		o.getSelectedPerks <- function(){
			this.logInfo("getSelectedPerks")
			::printData(this.m.SelectedPerks)
			return this.m.SelectedPerks
		}

		o.updateSelectedPerk <- function(_perkID, _val){
			if (!this.getContainer().getActor().getFlags().get("selectedPerks")){
				this.initSelectedPerks()
			}
			if (_val == 1){
				if (this.m.SelectedPerks.find(_perkID) == null){
					this.m.SelectedPerks.push(_perkID)
				}
			}
			else{
				if (this.m.SelectedPerks.find(_perkID) != null){
					this.m.SelectedPerks.remove(this.m.SelectedPerks.find(_perkID))
				}
			}
		}
		o.setSelectedPerks <- function(_perks){
			this.m.SelectedPerks = _perks
		}
		o.addToSelectedPerks <- function(_perks){
			foreach (perkID in perks){
				this.m.updateSelectedPerk(perkID, 1)
			}
		}
	})
	::mods_hookExactClass("entity/tactical/player", function(o){
		local onSerialize = o.onSerialize	
		o.onSerialize = function(_out){
			onSerialize(_out)
			if(this.getFlags().get("selectedPerks")){
				local selectedPerks = this.getBackground().m.SelectedPerks
				local len = selectedPerks.len()
				_out.writeU8(len);
				foreach(perkID in selectedPerks){
					_out.writeString(perkID)
				}
			}
		}

		local onDeserialize = o.onDeserialize
		o.onDeserialize = function(_in){
			onDeserialize(_in)
			local background = this.getBackground()
			background.m.SelectedPerks <- []
			if(this.getFlags().get("selectedPerks")){
				local len = _in.readU8()
				for (local x = 0; x < len; x++){
					background.m.SelectedPerks.push(_in.readString())
				}
			}
		}
	})
	::mods_hookNewObject("ui/screens/character/character_screen", function(o){
		
		o.onUpdateSelectedPerk <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			brother.getBackground().updateSelectedPerk(_data[1], _data[2]);
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onClearSelectedPerks <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			brother.getBackground().initSelectedPerks();
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onSaveSelectedPerks <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			this.World.Perks.addPerkBuild(_data[1], brother.getBackground().getSelectedPerks())
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onLoadAllSelectedPerks <- function(_data){
			this.logInfo("in onLoadAllSelectedPerks")
			local result = {perks = this.World.Perks.getAllPerkBuilds()}
			::printData(result)
			return result
		}
		o.onLoadSelectedPerksFromName <- function(_data){
			local brother = this.Tactical.getEntityByID(_data[0])
			brother.getBackground().setSelectedPerks(this.World.Perks.loadPerkBuild(_data[1]))
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onLoadSelectedPerksFromCode <-function(_data){
			//data = brotherID, perkBuildID
			this.logInfo("onLoadSelectedPerksFromCode, code: " + _data[1])
			local brother = this.Tactical.getEntityByID(_data[0])
			local parsedData = this.World.Perks.importSinglePerkBuild(_data[1])
			brother.getBackground().setSelectedPerks(parsedData)
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onCopyCurrentPerks <- function(_data){
			//data = brotherID
			local brother = this.Tactical.getEntityByID(_data[0])
			local parsedData = this.World.Perks.exportSinglePerkBuild(brother.getBackground().getSelectedPerks())
			this.logInfo("parsedData" + parsedData)
			local result = {code = parsedData}
			return result
		}
		o.onCopyPerksFromName <- function(_data){
			//_data = perkBuildID
			local parsedData = this.World.Perks.exportSinglePerkBuild(this.World.Perks.loadPerkBuild(_data[0]))
			local result = {code = parsedData}
			return result
		}
		o.onDeletePerks <- function(_data){
			//data = perkBuildID
			this.World.Perks.removePerkBuild(_data[0])
		}
	})

	::mods_hookNewObject("ui/screens/tooltip/tooltip_events", function ( o )
	{
		local general_queryUIElementTooltipData = o.general_queryUIElementTooltipData
		o.general_queryUIElementTooltipData = function( _entityId, _elementId, _elementOwner )
		{
			local entity;

			if (_entityId != null)
			{
				entity = this.Tactical.getEntityByID(_entityId);
			}

			switch(_elementId)
			{
				case "mod-plan-perks.save-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Open perks menu"
						},
						{
							id = 2,
							type = "description",
							text = "Open the menu to save and load perk builds."
						}
					];

				case "mod-plan-perks.clear-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Reset perks"
						},
						{
							id = 2,
							type = "description",
							text = "Clear all selected perks for this brother."
						}
					];
				case "mod-plan-perks.menu.save-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Save current perks"
						},
						{
							id = 2,
							type = "description",
							text = "Save the currently selected perks of this brother under a new build."
						}
					];

				case "mod-plan-perks.menu.copy-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Copy current perks"
						},
						{
							id = 2,
							type = "description",
							text = "Copy the currently selected perks of this brother to your clipboard."
						}
					];
				case "mod-plan-perks.menu.paste-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Copy current perks"
						},
						{
							id = 2,
							type = "description",
							text = "Paste contents of your clipboard to the input field."
						}
					];
				case "mod-plan-perks.menu.load-single-build-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Load perk build"
						},
						{
							id = 2,
							type = "description",
							text = "Load a perk build onto the current brother based on the code in the input field."
						}
					];
				case "mod-plan-perks.menu.load-all-builds-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Load all perk builds"
						},
						{
							id = 2,
							type = "description",
							text = "Create many perk builds and save them based on the code in the input field."
						}
					];
				case "mod-plan-perks.menu.list.load-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Load perk build"
						},
						{
							id = 2,
							type = "description",
							text = "Load the perk build onto the current brother."
						}
					];
				case "mod-plan-perks.menu.list.copy-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Copy perk build"
						},
						{
							id = 2,
							type = "description",
							text = "Copy the code of the perk build."
						}
					];

				case "mod-plan-perks.menu.list.delete-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Delete perk build"
						},
						{
							id = 2,
							type = "description",
							text = "Delete the perk build."
						}
					];
				case "mod-plan-perks.menu.override-perks-toggle":
					return [
						{
							id = 1,
							type = "title",
							text = "Toggle override"
						},
						{
							id = 2,
							type = "description",
							text = "If this is selected, selected perks will be overriden if you load a new build. Otherwise, the perks will be added to the already selected perks."
						}
					];
				case "mod-plan-perks.menu.perk-build-name-input":
					return [
						{
							id = 1,
							type = "title",
							text = "Perk build name"
						},
						{
							id = 2,
							type = "description",
							text = "Enter the name of a new build that you wish to save."
						}
					];
				case "mod-plan-perks.menu.perk-code-input":
					return [
						{
							id = 1,
							type = "title",
							text = "Enter Code"
						},
						{
							id = 2,
							type = "description",
							text = "Enter perk build code, either of a single build or of many builds."
						}
					];
			}
			return general_queryUIElementTooltipData( _entityId, _elementId, _elementOwner )
		}
	});
})