local modName = "mod_plan_perks"
::mods_registerMod(modName, 4.1)
::mods_registerJS("mod_plan_perks.js");
::mods_registerCSS("mod_plan_perks.css");
::mods_queue(null, ">mod_msu", function()
{
	local gt = this.getroottable()
	::PlanYourPerks <- {};
	::PlanYourPerks.Mod <- ::MSU.Class.Mod(modName, "5.0.0", "Plan your Perks");
	::PlanYourPerks.Colors <- {
	}
	::PlanYourPerks.Colors[2] <- {
		RGB = null,
		Overlay = null
	},
	::PlanYourPerks.Colors[3] <- {
		RGB = null,
		Overlay = null
	},
	::PlanYourPerks.Colors[4] <- {
		RGB = null,
		Overlay = null
	},

	::PlanYourPerks.UpdateColorsFromSettings <- function()
	{
		this.Colors[2].RGB = ::PlanYourPerks.Mod.ModSettings.getSetting("planned_picker").ValuesAsRGBA;
		this.Colors[2].Overlay = ::PlanYourPerks.Mod.ModSettings.getSetting("planned_shadow").getValue();

		this.Colors[3].RGB = ::PlanYourPerks.Mod.ModSettings.getSetting("temporary_picker").ValuesAsRGBA;
		this.Colors[3].Overlay = ::PlanYourPerks.Mod.ModSettings.getSetting("temporary_shadow").getValue();

		this.Colors[4].RGB = ::PlanYourPerks.Mod.ModSettings.getSetting("forbidden_picker").ValuesAsRGBA;
		this.Colors[4].Overlay = ::PlanYourPerks.Mod.ModSettings.getSetting("forbidden_shadow").getValue();
	}

	local visualsPage = ::PlanYourPerks.Mod.ModSettings.addPage("Visuals");
	visualsPage.addColorPickerSetting("planned_picker", "0,141,0,0.7", "Planned Color");
	visualsPage.addBooleanSetting("planned_shadow", false, "Add a shadow")
	visualsPage.addDivider("1");

	visualsPage.addColorPickerSetting("temporary_picker", "0,255,0,0.7", "Temporary Color");
	visualsPage.addBooleanSetting("temporary_shadow", false, "Add a shadow")
	visualsPage.addDivider("2");

	visualsPage.addColorPickerSetting("forbidden_picker", "255,0,0,0.7", "Forbidden Color");
	visualsPage.addBooleanSetting("forbidden_shadow", true, "Add a shadow")

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
			if (!("PlannedPerks" in _entity.m)) return PlannedPerksDict
			foreach(key, value in _entity.m.PlannedPerks){
				PlannedPerksDict[key] <- value
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
			this.World.Perks.serializeWithFlags()
			onSerialize(_out)
		}


		local onDeserialize = o.onDeserialize
		o.onDeserialize = function(_in){
			onDeserialize(_in)
			this.World.Perks.deserializeWithFlags()
		}
		
		local helper_handleContextualKeyInput = o.helper_handleContextualKeyInput
		o.helper_handleContextualKeyInput <- function( _key )
		{
			if (this.isInCharacterScreen() && _key.getState() == 0)
			{
				switch(_key.getKey())
				{
				case 41:
					this.toggleCharacterScreen(_key);
					return false
				}
			}
			return helper_handleContextualKeyInput(_key)
		}
		
		o.toggleCharacterScreen <- function(_key = null)
		{
			if (this.m.CharacterScreen.isVisible())
			{
				if (this.m.CharacterScreen.m.PopupDialogVisible)
				{
					if (_key == null) return
					else this.m.CharacterScreen.m.JSDataSourceHandle.asyncCall("destroyPopupDialog", null);
				}
				else this.character_screen_onClosePressed();
			}
			else if (this.m.WorldTownScreen.isVisible())
			{
				this.showCharacterScreenFromTown();
			}
			else
			{
				this.showCharacterScreen();
			}
		}

	})


	::mods_hookExactClass("entity/tactical/player", function(o){
		o.m.PlannedPerks <- {}

		local onSerialize = o.onSerialize	
		o.onSerialize = function(_out){
			this.World.Perks.serializeBrotherPerksWithFlag(this)
			onSerialize(_out)
		}

		local onDeserialize = o.onDeserialize
		o.onDeserialize = function(_in){
			onDeserialize(_in)
			this.World.Perks.deserializeBrotherPerksWithFlag(this)
		}
	})

	::mods_hookNewObject("ui/screens/character/character_screen", function(o){
		//see the JS file for documentation about their function
		o.onQueryColorData <- function(_data)
		{
			this.logInfo("arrives here")
			::PlanYourPerks.UpdateColorsFromSettings();
			return ::PlanYourPerks.Colors
		}
		o.onUpdatePlannedPerk <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			this.World.Perks.updatePlannedPerk(brother, _data[1], _data[2]);
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onClearPlannedPerks <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			this.World.Perks.clearPlannedPerks(brother);
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onSavePlannedPerks <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			this.World.Perks.addPerkBuild(_data[1], this.World.Perks.getPlannedPerks(brother))
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onLoadAllPerkBuilds <- function(_data){
			//data = null
			return {perks = this.World.Perks.getAllPerkBuilds()}
		}
		o.onApplyPerkBuildFromName <- function(_data){
			//data = brotherID, perkBuildID, overrideBool
			local brother = this.Tactical.getEntityByID(_data[0])
			this.World.Perks.setPlannedPerks(brother, this.World.Perks.getPerkBuild(_data[1]), _data[2])
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onApplyPerkBuildFromString <- function(_data){
			//data = brotherID, perkBuildID
			local brother = this.Tactical.getEntityByID(_data[0])
			local perks = this.World.Perks.parsePerkBuildString(_data[1]).Perks
			//return error?
			if(perks != null) this.World.Perks.setPlannedPerks(brother, perks, _data[2])
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onImportPerkBuildsFromString <- function(_data){
			//data = code containing string to parse with name and perk array
			this.World.Perks.importPerkBuilds(_data[0])
		}

		o.onExportCurrentPerks <- function(_data){
			//data = brotherID
			local brother = this.Tactical.getEntityByID(_data[0])
			local parsedCode = this.World.Perks.stringifyPerks(this.World.Perks.getPlannedPerks(brother))
			return { parsedCode = parsedCode }

		}
		o.onStringifyPerkBuildFromName <- function(_data){
			//_data = perkBuildID
			local perks = this.World.Perks.getPerkBuild(_data[0])
			local parsedCode = this.World.Perks.stringifyPerkBuild(_data[0], this.World.Perks.getPerkBuild(_data[0]))
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
				case "mod-plan-perks.perk-num-label":
					return [
						{
							id = 1,
							type = "title",
							text = "Number of planned perks"
						},
						{
							id = 2,
							type = "description",
							text = "Number of planned perks for this character."
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
							text = "Save the planned perks of this character as a new build. Does not include unlocked perks that are not 'planned'. \n[color=" + this.Const.UI.Color.NegativeValue + "]Note: to unlock this button, you must enter a name, select at least one perk, and can't use these characters: ° ~ $ #[/color]"
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