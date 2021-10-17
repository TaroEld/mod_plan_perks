local modName = "mod_plan_perks"
::mods_registerMod(modName, 1.0)
::mods_registerJS("mod_plan_perks.js");
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
			return _entity.getBackground().m.SelectedPerks
		}
	})

	::mods_hookExactClass("skills/backgrounds/character_background", function(o){
		o.m.SelectedPerks <- []
		o.initSelectedPerks <- function(){
			local perks = this.Const.Perks.Perks
			foreach (perkList in perks){
				foreach(perk in perkList){
					this.m.SelectedPerks.push(0)
				}
			}
			this.getContainer().getActor().getFlags().set("selectedPerks", true)
		}

		/*local onAdded = o.onAdded
		o.onAdded = function(){
			onAdded()
			this.initSelectedPerks()
		}*/

		o.updateSelectedPerk <- function(_idx, _val){
			if (!this.getContainer().getActor().getFlags().get("selectedPerks")){
				this.initSelectedPerks()
			}
			this.m.SelectedPerks[_idx] = _val
		}

		o.getSelectedPerkIdx <- function(_perkID){
			local idx = 0;
			local perks = this.Const.Perks.Perks
			foreach (perkList in perks){
				foreach(perk in perkList){
					if (perk.ID == _perkID){
						return idx
					}
					idx++
				}
			}
			return -1
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
				foreach(perk in selectedPerks){
					_out.writeU8(perk)
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
					background.m.SelectedPerks.push(_in.readU8())
				}
			}
		}
	})
	::mods_hookNewObject("ui/screens/character/character_screen", function(o){
		
		o.onUpdateSelectedPerk <- function(_data){
			//_data = _entity, _perk, _bool
			local brother = this.Tactical.getEntityByID(_data[0])
			brother.getBackground().updateSelectedPerk(brother.getBackground().getSelectedPerkIdx(_data[1]), _data[2]);
			return this.UIDataHelper.convertEntityToUIData(brother, null);
		}
	})
})