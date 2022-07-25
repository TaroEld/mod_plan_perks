this.perk_manager <- {
	m = {
		PerkBuilds = {},
		BetweenPerkDelimiter = "°",
		BetweenBuildsDelimiter = "~",
		BetweenNameAndPerksDelimiter = "$",
		WithinPerksDelimiter = "#",
		PlannedPerkStatus = {
    		Unplanned = 1,
    		Planned = 2,
    		Temporary = 3,
    		Forbidden = 4
		},
		NeedsUpdate = false
	},

	function importPerkBuilds(_perkBuildsString)
	{
		local builds = split(_perkBuildsString, this.m.BetweenBuildsDelimiter)
		foreach(build in builds){
			local result = this.parsePerkBuildString(build)
			if(result.Name != null && result.Perks != null) this.m.PerkBuilds[result.Name] <- result.Perks;
		}
	}

	function exportPerkBuilds()
	{
		local resultString = "";
		foreach(buildName, perks in this.m.PerkBuilds)
		{
			resultString += this.stringifyPerkBuild(buildName, perks);
			resultString += this.m.BetweenBuildsDelimiter;
		}
		return resultString;
	}

	function printPerkBuilds(_resultString)
	{
		this.logInfo("Exported perk build(s). Resulting Code: " + _resultString + " . Use 'Import Build(s)' to import these codes again.")
	}

	function stringifyPerkBuild(_buildName, _perksAsTable)
	{
		return _buildName + this.m.BetweenNameAndPerksDelimiter + this.stringifyPerks(_perksAsTable)
	}

	function stringifyPerks(_perksAsTable)
	{
		local resultString = "";
		foreach(perkID, perkValue in _perksAsTable){
			resultString += perkID + this.m.WithinPerksDelimiter + perkValue +  this.m.BetweenPerkDelimiter 
		}
		return resultString
	}

	function parsePerkBuildString(_perkBuildString)
	{
		local result = {
			Name = null,
			Perks = null
		}
		local splitResult = this.splitNameAndPerks(_perkBuildString);
		result.Name = splitResult.Name;
		result.Perks = this.getPerksAsTableFromString(splitResult.PerksAsString);
		return result;
	}

	function splitNameAndPerks(_perkBuildString)
	{
		local result =
		{
			Name = null,
			PerksAsString = null
		}
		if (_perkBuildString.find(this.m.BetweenNameAndPerksDelimiter) == null)
		{
			result.PerksAsString = _perkBuildString
		}
		else
		{
			local splitResult = split(_perkBuildString, this.m.BetweenNameAndPerksDelimiter);
			result.Name = splitResult[0];
			result.PerksAsString = splitResult[1]
		}
		return result;
	}

	function getPerksAsTableFromString(_perksString)
	{
		if(_perksString.find(this.m.BetweenPerkDelimiter) == null){
			return
		}
		local tableResult = {}
		local result = split(_perksString, this.m.BetweenPerkDelimiter)
		foreach(perk in result){
			local splitIntoNameAndValue = split(perk, this.m.WithinPerksDelimiter)
			tableResult[splitIntoNameAndValue[0]] <- splitIntoNameAndValue[1]
		}
		return tableResult
	}

	function addPerkBuild(_name, _perksTable)
	{
		this.m.PerkBuilds[_name] <- {}
		foreach(key, value in _perksTable){
			this.m.PerkBuilds[_name][key] <- value
		}
	}

	function removePerkBuild(_name)
	{
		this.m.PerkBuilds.rawdelete(_name) 
	}

	function getPerkBuild(_name)
	{
		return clone this.m.PerkBuilds[_name]
	}
	
	function getPerkBuildAsDict(_name)
	{
		local result = {}
		result[_name] <- this.getPerkBuild(_name)
		return result
	}

	function getAllPerkBuilds()
	{
		return this.m.PerkBuilds
	}

	function clearPlannedPerks(_brother)
	{
		_brother.m.PlannedPerks = {};
	}

	function getPlannedPerks(_brother)
	{
		return _brother.m.PlannedPerks
	}

	function updatePlannedPerk(_brother, _perkID, _plannedStatus)
	{
		if (_plannedStatus != this.m.PlannedPerkStatus.Unplanned)
		{
			_brother.m.PlannedPerks[_perkID] <- _plannedStatus
		}
		else
		{
			_brother.m.PlannedPerks.rawdelete(_perkID)
		}
	}

	function setPlannedPerks(_brother, _perks, _override = true)
	{
		if (_override) _brother.m.PlannedPerks = {}
		this.addToPlannedPerks(_brother, _perks)
	}

	function addToPlannedPerks(_brother, _perks)
	{
		foreach (perkID, perkvalue in _perks)
		{
			this.updatePlannedPerk(_brother, perkID, perkvalue)
		}
	}

	function serializeBrotherPerksWithFlag(_brother)
	{
		local perks = this.getPlannedPerks(_brother)
		if (perks.len() == 0) _brother.getFlags().set("PlannedPerks", false)	
		else _brother.getFlags().set("PlannedPerks", this.stringifyPerks(perks))
	}

	function deserializeBrotherPerksWithFlag(_brother)
	{
		local flag = _brother.getFlags().get("PlannedPerks")
		if (!flag || flag == null)
		{
			return;
		}
		local perks = this.getPerksAsTableFromString(flag);
		this.setPlannedPerks(_brother, perks);
	}

	function serializeBuilds()
	{
		local resultString = this.exportPerkBuilds();
		this.serializeWithFlags(resultString);
		this.serializeWithBBParser(resultString);
	}

	function deserializeBuilds()
	{
		local flag = this.World.Flags.get("Perk_Manager");
		if (typeof flag != "string" || flag.len() == 0)
		{
			this.deserializeWithBBParser();
		}
		else
		{
			this.deserializeWithFlags(flag);
		}
	}

	function serializeWithFlags(_resultString)
	{
		this.World.Flags.set("Perk_Manager", _resultString);
	}

	function serializeWithBBParser(_resultString)
	{
		if (::PlanYourPerks.Mod.ModSettings.getSetting("BBParser").getValue())
		{
			::PlanYourPerks.Mod.PersistentData.writeToLog("PerkBuild", format("::PlanYourPerks.PerkManager.importPerkBuilds(\"%s\");", _resultString));
		}
	}

	function deserializeWithFlags(_flag)
	{
		this.importPerkBuilds(_flag);
	}

	function deserializeWithBBParser()
	{
		::PlanYourPerks.Mod.PersistentData.loadFile("PerkBuild");
	}
};

