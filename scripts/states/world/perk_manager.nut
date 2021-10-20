this.perk_manager <- {
	m = {
		PerkBuilds = {},
		ForbiddenSign = "*",
		ForbiddenSignTwo = "#"
	},

	function importPerkBuilds(_code){
		local builds = split(_code, this.m.ForbiddenSignTwo)
		foreach(build in builds){
			local result = split(build, this.m.ForbiddenSign)
			this.m.PerkBuilds[result[0]] <- result.slice(1, result.len())
		}
	}
	function exportPerkBuilds(){
		local resultString = ""
		foreach(buildName, perks in this.m.PerkBuilds){
			resultString += buildName + this.m.ForbiddenSign
			foreach(perkID in perks){
				resultString += perkID + this.m.ForbiddenSign
			}
			resultString += this.m.ForbiddenSignTwo
		}
		return resultString
	}
	
	function importSinglePerkBuild(_code){
		return split(_code, this.m.ForbiddenSign)
	}
	function exportSinglePerkBuild(_code){
		local perks;
		if(typeof _code == "array") perks = _code;
		else perks = this.m.PerkBuilds[_name];
		local resultString = ""
		foreach(key in perks){
			resultString += key + this.m.ForbiddenSign;
		}
		return resultString
	}


	function addPerkBuild(_name, _code){
		this.m.PerkBuilds[_name] <- clone _code
	}
	function removePerkBuild(_name){
		this.m.PerkBuilds.rawdelete(_name) 
	}

	function loadPerkBuild(_name){
		return this.m.PerkBuilds[_name]
	}
	function getAllPerkBuilds(){
		return this.m.PerkBuilds
	}
	function clearPerks(_brother){
		
	}
	
	function onSerialize( _out )
	{
	}

	function onDeserialize( _in )
	{
	}

};

