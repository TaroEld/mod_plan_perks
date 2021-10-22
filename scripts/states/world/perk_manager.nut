this.perk_manager <- {
	m = {
		PerkBuilds = {},
		BetweenPerkDelimiter = "°",
		BetweenBuildsDelimiter = "~"
	},

	function importPerkBuilds(_code){
		local builds = split(_code, this.m.BetweenBuildsDelimiter)
		foreach(build in builds){
			
			local result = split(build, this.m.BetweenPerkDelimiter)			
			this.m.PerkBuilds[result[0]] <- result.slice(1, result.len())
		}
	}
	function exportPerkBuilds(_builds){
		local resultString = ""
		foreach(buildName, perks in _builds){
			resultString += buildName + this.m.BetweenPerkDelimiter
			foreach(perkID in perks){
				resultString += perkID + this.m.BetweenPerkDelimiter
			}
			resultString += this.m.BetweenBuildsDelimiter
		}
		this.logInfo("Exported perk build(s). Resulting Code: " + resultString + " . Use 'Import Build(s)' to import these codes again.")
		return resultString
	}

	function stripNameFromCode(_code){
		local result = split(_code, this.m.BetweenPerkDelimiter)
		return result.slice(1, result.len()-1)
	}

	function addPerkBuild(_name, _code){
		this.m.PerkBuilds[_name] <- clone _code
	}

	function removePerkBuild(_name){
		this.m.PerkBuilds.rawdelete(_name) 
	}

	function getPerkBuildCode(_name){
		return this.m.PerkBuilds[_name]
	}
	
	function getPerkBuildAsDict(_name){
		local result = {}
		result[_name] <- this.m.PerkBuilds[_name]
		return result
	}
	function getAllPerkBuilds(){
		return this.m.PerkBuilds
	}
	
	function onSerialize( _out )
	{
		local len = this.m.PerkBuilds.len()
		_out.writeU8(len);
		foreach(buildName, perkArray in this.m.PerkBuilds){
			_out.writeString(buildName)
			_out.writeU8(perkArray.len());
			foreach(_perkID in perkArray){
				_out.writeString(_perkID);
			}
		}
	}

	function onDeserialize( _in )
	{
		//this.m.PerkBuilds <- {}
		local len = _in.readU8();
		for( local i = 0; i < len; i = ++i )
		{
			local buildName = _in.readString()
			this.m.PerkBuilds[buildName] <- []
			local buildLen =  _in.readU8()
			for( local j = 0; j < buildLen; j++ )
			{
				local perkName = _in.readString()
				this.m.PerkBuilds[buildName].push(perkName)
			}
		}

	}

};

