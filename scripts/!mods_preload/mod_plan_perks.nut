local modName = "mod_plan_perks"
::mods_registerMod(modName, 2.0)
::mods_registerJS("mod_plan_perks.js");
::mods_registerCSS("mod_plan_perks.css");
::mods_queue(null, null, function()
{
	local gt = this.getroottable()


	::mods_hookNewObject("ui/global/data_helper", function(o){
		local convertEntityToUIData = o.convertEntityToUIData
		o.convertEntityToUIData = function(_entity, _activeEntity){
			local result = convertEntityToUIData(_entity, _activeEntity)
			result.PlannedPerks <- this.addPlannedPerksToUIData(_entity)
			return result
		}

		o.addPlannedPerksToUIData <- function(_entity){
			local PlannedPerksDict = {}
			//weird error
			if (!("getBackground" in _entity) || _entity.getBackground() == null) return PlannedPerksDict
			foreach(key in _entity.getBackground().m.PlannedPerks){
				PlannedPerksDict[key] <- 1
			}
			return PlannedPerksDict
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
			this.World.Flags.set("Perk_Manager", true)
			onSerialize(_out)
			this.World.Perks.onSerialize(_out)
		}


		local onDeserialize = o.onDeserialize
		o.onDeserialize = function(_in){
			onDeserialize(_in)
			if (this.World.Flags.has("Perk_Manager")){
				this.World.Perks.onDeserialize(_in)
			}
		}

	})

	::mods_hookExactClass("skills/backgrounds/character_background", function(o){
		o.m.PlannedPerks <- []
		o.initPlannedPerks <- function(){
			this.m.PlannedPerks = []
			this.getContainer().getActor().getFlags().set("PlannedPerks", true)
		}
		o.getPlannedPerks <- function(){
			return this.m.PlannedPerks
		}

		o.updatePlannedPerk <- function(_perkID, _val){
			if (!this.getContainer().getActor().getFlags().get("PlannedPerks")){
				this.initPlannedPerks()
			}
			if (_val == 1){
				if (this.m.PlannedPerks.find(_perkID) == null){
					this.m.PlannedPerks.push(_perkID)
				}
			}
			else{
				if (this.m.PlannedPerks.find(_perkID) != null){
					this.m.PlannedPerks.remove(this.m.PlannedPerks.find(_perkID))
				}
			}
		}
		o.setPlannedPerks <- function(_perks, _override = true){
			if (_override) this.m.PlannedPerks = _perks
			else this.addToPlannedPerks(_perks)
			
		}
		o.addToPlannedPerks <- function(_perks){
			foreach (perkID in _perks){
				this.updatePlannedPerk(perkID, 1)
			}
		}
	})
	::mods_hookExactClass("entity/tactical/player", function(o){
		local onSerialize = o.onSerialize	
		o.onSerialize = function(_out){
			onSerialize(_out)
			if(this.getFlags().get("PlannedPerks")){
				local PlannedPerks = this.getBackground().m.PlannedPerks
				local len = PlannedPerks.len()
				_out.writeU8(len);
				foreach(perkID in PlannedPerks){
					_out.writeString(perkID)
				}
			}
		}

		local onDeserialize = o.onDeserialize
		o.onDeserialize = function(_in){
			onDeserialize(_in)
			local background = this.getBackground()
			background.m.PlannedPerks <- []
			if(this.getFlags().get("PlannedPerks")){
				local len = _in.readU8()
				for (local x = 0; x < len; x++){
					background.m.PlannedPerks.push(_in.readString())
				}
			}
		}
	})
	::mods_hookNewObject("ui/screens/character/character_screen", function(o){
		//see the JS file for documentation about their function
		
		o.onUpdatePlannedPerk <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			brother.getBackground().updatePlannedPerk(_data[1], _data[2]);
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onClearPlannedPerks <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			brother.getBackground().initPlannedPerks();
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onSavePlannedPerks <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			this.World.Perks.addPerkBuild(_data[1], brother.getBackground().getPlannedPerks())
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onLoadAllPerkBuilds <- function(_data){
			//data = null
			return {perks = this.World.Perks.getAllPerkBuilds()}
		}
		o.onApplyPerkBuildFromName <- function(_data){
			//data = brotherID, perkBuildID, overrideBool
			local brother = this.Tactical.getEntityByID(_data[0])
			brother.getBackground().setPlannedPerks(this.World.Perks.getPerkBuildCode(_data[1]), _data[2])
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onApplyPerkBuildFromCode <-function(_data){
			//data = brotherID, perkBuildID
			local brother = this.Tactical.getEntityByID(_data[0])
			local perkIDArray = this.World.Perks.stripNameFromCode(_data[1])
			brother.getBackground().setPlannedPerks(perkIDArray, _data[2])
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onImportPerkBuildsFromCode <-function(_data){
			//data = code containing string to parse with name and perk array
			this.World.Perks.importPerkBuilds(_data[0])
		}

		o.onExportCurrentPerks <- function(_data){
			//data = brotherID
			local brother = this.Tactical.getEntityByID(_data[0])
			local dataAsDict = {placeholderName = brother.getBackground().getPlannedPerks()}
			local parsedCode = this.World.Perks.exportPerkBuilds(dataAsDict)
			return { parsedCode = parsedCode }

		}
		o.onExportSinglePerkBuildFromName <- function(_data){
			//_data = perkBuildID
			local dataAsDict = this.World.Perks.getPerkBuildAsDict(_data[0])
			local parsedCode = this.World.Perks.exportPerkBuilds(dataAsDict)
			return  {parsedCode = parsedCode}
		}
		o.onExportAllPerkBuilds <- function(_data){
			//data = null
			local parsedCode = this.World.Perks.exportPerkBuilds(this.World.Perks.getAllPerkBuilds())
			return { parsedCode = parsedCode }
		}
		o.onDeletePerkBuild <- function(_data){
			//data = perkBuildID
			this.World.Perks.removePerkBuild(_data[0])
		}
		o.onQueryLegends <- function(_data){
			//data = null
			local hasLegends = ("LegendsMod" in this.getroottable())
			if (hasLegends){
				return [true, this.Const.Perks.PerkDefObjects]
			}
			else{
				return [false]
			}
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
							text = "Open perk build menu"
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
							text = "Reset planned perks"
						},
						{
							id = 2,
							type = "description",
							text = "Clear all planned perks for this character."
						}
					];
				case "mod-plan-perks.menu.save-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Save planned perks"
						},
						{
							id = 2,
							type = "description",
							text = "Save the planned perks of this character as a new build. Does not include unlocked perks that are not 'planned'. \n[color=" + this.Const.UI.Color.NegativeValue + "]Note: to unlock this button, you must enter a name, select at least one perk, and can't use the characters '°' or '~'.[/color]"
						}
					];

				case "mod-plan-perks.menu.copy-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Export Build"
						},
						{
							id = 2,
							type = "description",
							text = "Export the planned perks of this character to your clipboard."
						}
					];
				case "mod-plan-perks.menu.copy-all-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Export all perk builds"
						},
						{
							id = 2,
							type = "description",
							text = "Export all your saved builds to your clipboard."
						}
					];
				case "mod-plan-perks.menu.paste-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Paste clipboard"
						},
						{
							id = 2,
							type = "description",
							text = "Paste contents of your clipboard to the input field to the left. Use 'Apply Build' to apply the planned perks to this character, or 'Import Build(s)' to save the build."
						}
					];
				case "mod-plan-perks.menu.load-single-build-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Apply Build"
						},
						{
							id = 2,
							type = "description",
							text = "Apply a perk build from the input field to the left onto this character."
						}
					];
				case "mod-plan-perks.menu.load-all-builds-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Import Build(s)"
						},
						{
							id = 2,
							type = "description",
							text = "Import any number of builds from the input field to the left and save them in the list below."
						}
					];
				case "mod-plan-perks.menu.list.load-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Apply Perk Build"
						},
						{
							id = 2,
							type = "description",
							text = "Apply this perk build onto this character."
						}
					];
				case "mod-plan-perks.menu.list.copy-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Export Perk Build"
						},
						{
							id = 2,
							type = "description",
							text = "Export this perk build to the clipboard."
						}
					];


				case "mod-plan-perks.menu.list.delete-perks-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Delete Perk Build"
						},
						{
							id = 2,
							type = "description",
							text = "Delete this perk build."
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
							text = "If this is selected, planned perks will be overridden if you apply a build. Otherwise, the perks will be added to the already planned perks."
						}
					];
				case "mod-plan-perks.menu.perk-build-name-input":
					return [
						{
							id = 1,
							type = "title",
							text = "Perk Build Name"
						},
						{
							id = 2,
							type = "description",
							text = "Enter the name of a new build that you wish to save."
						}
					];
				case "mod-plan-perks.menu.sort-alphabetically-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Sort builds alphabetically"
						},
						{
							id = 2,
							type = "description",
							text = "Sort the build list alphabetically. Click again to reverse the order."
						}
					];
				case "mod-plan-perks.menu.sort-by-missing-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Sort builds by missing perks"
						},
						{
							id = 2,
							type = "description",
							text = "[LEGENDS ONLY] Sort the build list by number of missing perks in the current character's perk tree. Click again to reverse the order."
						}
					];
				case "mod-plan-perks.menu.sort-by-matching-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Sort builds by unlocked perks"
						},
						{
							id = 2,
							type = "description",
							text = "Sort the build list by number of unlocked perks. Click again to reverse the order."
						}
					];
				case "mod-plan-perks.menu.perk-code-input":
					return [
						{
							id = 1,
							type = "title",
							text = "Code Input Field"
						},
						{
							id = 2,
							type = "description",
							text = "Use 'Paste Clipboard' to enter perk build code(s), either of a single build or of many builds that were previously exported."
						}
					];
				case "mod-plan-perks.switch-previous-brother-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Switch to the previous brother"
						},
						{
							id = 2,
							type = "description",
							text = "Switch to the previous brother in your roster."
						}
					];
				case "mod-plan-perks.switch-next-brother-button":
					return [
						{
							id = 1,
							type = "title",
							text = "Switch to the next brother"
						},
						{
							id = 2,
							type = "description",
							text = "Switch to the next brother in your roster."
						}
					];			
				
			}
			return general_queryUIElementTooltipData( _entityId, _elementId, _elementOwner )
		}
	});
})