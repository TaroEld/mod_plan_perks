this.perk_manager <- {
	m = {
		PerkBuilds = {},
		BetweenPerkDelimiter = "°",
		BetweenBuildsDelimiter = "~",
		BetweenNameAndPerksDelimiter = "$",
		WithinPerksDelimiter = "#",
	},

	function importPerkBuilds(_code){
		local builds = split(_code, this.m.BetweenBuildsDelimiter)
		foreach(build in builds){
			local result = this.parseCode(build)
			if(result.Name != null && result.Perks != null) this.m.PerkBuilds[result.Name] <- result.Perks;
		}
	}
	function exportPerkBuilds(_builds){
		local resultString = ""
		foreach(buildName, perks in _builds){
			resultString += this.exportSinglePerkBuild(buildName, perks)
			resultString += this.m.BetweenBuildsDelimiter
		}
		this.logInfo("Exported perk build(s). Resulting Code: " + resultString + " . Use 'Import Build(s)' to import these codes again.")
		return resultString
	}
	function exportSinglePerkBuild(_buildName, _perks){
		local resultString = ""
		resultString += _buildName + this.m.BetweenNameAndPerksDelimiter
		foreach(perkID, perkValue in _perks){
			resultString += perkID + this.m.WithinPerksDelimiter + perkValue +  this.m.BetweenPerkDelimiter 
		}
		return resultString
	}

	function parseCode(_code){
		local result = {
			Name = null,
			Perks = null
		}
		result.Name = this.getNameFromCode(_code)
		result.Perks = this.getPerksAsArrayFromCode(this.getCodeWithoutName(_code))
		return result
	}

	function getNameFromCode(_code){
		if(_code.find(this.m.BetweenNameAndPerksDelimiter) == null){
			return
		}
		local result = split(_code, this.m.BetweenNameAndPerksDelimiter)
		return result[0]
	}
	function getCodeWithoutName(_code){
		if(_code.find(this.m.BetweenNameAndPerksDelimiter) == null){
			return _code
		}
		local result = split(_code, this.m.BetweenNameAndPerksDelimiter)
		return result[1]
	}
	function getPerksAsArrayFromCode(_code){
		if(_code.find(this.m.BetweenPerkDelimiter) == null){
			return
		}
		local tableResult = {}
		local result = split(_code, this.m.BetweenPerkDelimiter)
		foreach(perk in result){
			local splitIntoNameAndValue = split(perk, this.m.WithinPerksDelimiter)
			tableResult[splitIntoNameAndValue[0]] <- splitIntoNameAndValue[1]
		}
		return tableResult
	}

	function addPerkBuild(_name, _code){
		this.m.PerkBuilds[_name] <- {}
		foreach(key, value in _code){
			this.m.PerkBuilds[_name][key] <- value
		}
	}

	function removePerkBuild(_name){
		this.m.PerkBuilds.rawdelete(_name) 
	}

	function getPerkBuild(_name){
		return clone this.m.PerkBuilds[_name]
	}
	
	function getPerkBuildAsDict(_name){
		local result = {}
		result[_name] <- this.getPerkBuild(_name)
		return result
	}
	function getAllPerkBuilds(){
		return this.m.PerkBuilds
	}

	function serializeWithFlags()
	{
		this.World.Flags.set("Perk_Manager", this.exportPerkBuilds(this.getAllPerkBuilds()));
	}

	function deserializeWithFlags()
	{
		local flag = this.World.Flags.get("Perk_Manager")
		if (typeof flag != "string" || flag.len() == 0) return
		this.importPerkBuilds(flag);
	}







	function clearPlannedPerks(_brother){
		_brother.m.PlannedPerks = {}
	}

	function getPlannedPerks(_brother){
		return _brother.m.PlannedPerks
	}

	function updatePlannedPerk(_brother, _perkID, _plannedOrForbidden){
		if (_plannedOrForbidden != 0){
			_brother.m.PlannedPerks[_perkID] <- _plannedOrForbidden
		}
		else{
			_brother.m.PlannedPerks.rawdelete(_perkID)
		}
	}

	function setPlannedPerks(_brother, _perks, _override = true){
		if (_override) _brother.m.PlannedPerks = {}
		this.addToPlannedPerks(_brother, _perks)
	}

	function addToPlannedPerks(_brother, _perks){
		foreach (perkID, perkvalue in _perks){
			this.updatePlannedPerk(_brother, perkID, perkvalue)
		}
	}

	function serializeBrotherPerksWithFlag(_brother){
		local perks = this.getPlannedPerks(_brother)
		if(perks.len() == 0){
			return
		}
		else _brother.getFlags().set("PlannedPerks", this.exportSinglePerkBuild("placeholdername", perks))		
	}

	function deserializeBrotherPerksWithFlag(_brother){
		local flag = _brother.getFlags().get("PlannedPerks")
		if (!flag || flag == null){
			return
		}
		local perks = this.parseCode(flag).Perks
		this.setPlannedPerks(_brother, perks);
	}

	


};

