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
		o.getCurrentPerks <- function(){
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
			this.logInfo(_out)
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
			this.World.Perks.addPerkBuild(_data[1], brother.getBackground().getCurrentPerks())
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onLoadAllSelectedPerks <- function(){
			//_data = _entity, _perk, _bool
			return this.World.Perks.getAllPerkBuilds()
		}
		o.onLoadSelectedPerks <- function(_data){
			local brother = this.Tactical.getEntityByID(_data[0])
			brother.getBackground().setSelectedPerks(_data[1])
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
		o.onLoadSelectedPerksFromCode <-function(_data){
			local brother = this.Tactical.getEntityByID(_data[0])
			local parsedData = this.World.Perks.parseCodeFromHash(_data[1])
			brother.getBackground().setSelectedPerks(parsedData)
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
	})
})