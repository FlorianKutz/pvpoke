var getBreakPoints = function(speciesId, league, moveset){
    var calcPointCallback = (poke, opp) => poke.calculateBreakpoints(opp);
    calcPoints(speciesId, league, moveset, "guaranteedAttack", 41, calcPointCallback);
}

var getBulkPoints = function(speciesId, league, moveset){
    var calcPointCallback = (poke, opp) => poke.calculateBulkpoints(opp);
    calcPoints(speciesId, league, moveset, "guaranteedDefense", 41, calcPointCallback);
}

var calcPoints = function(speciesId, league, moveset, sortCriteria, levelCap, calcPointCallback){
    var battle = new Battle();
    battle.setCP(league);

    var gm = GameMaster.getInstance();
    let rankingsKey = "alloverall" + league;
    let rankings = gm.rankings[rankingsKey];
    
    var pokemon = new Pokemon(speciesId, 0, battle);
    pokemon.levelCap = levelCap;
    pokemon.initialize(battle.getCP(), "maximize");
    pokemon.selectMove("fast", moveset[0]);
    pokemon.selectMove("charged", moveset[1], 0);

    if(moveset.length > 2){
        pokemon.selectMove("charged", moveset[2],1);
    } else{
        pokemon.selectMove("charged", "none", 1);
    }
    
    let breakpoints = [];
    for(let poke of rankings){
        if(poke.score < 75) break;
        let opponent = new Pokemon(poke.speciesId, 1, battle);
        opponent.levelCap = levelCap;
        opponent.initialize(battle.getCP(), "maximize");
        opponent.selectMove("fast", poke.moveset[0]);
        opponent.selectMove("charged", poke.moveset[1], 0);
        let breakpoint = calcPointCallback(pokemon, opponent);
        breakpoint.forEach(bp => {
            bp.opponent = poke.speciesId;
            bp.ownMove = moveset[0];
            bp.oppMove = poke.moveset[0];
        });
        breakpoints = breakpoints.concat(breakpoint);
    }
    breakpoints.sort((bp1, bp2) => bp2[sortCriteria]-bp1[sortCriteria]);
    console.log(breakpoints);
}

var parseShit = function(){
    let buf = fs.readFileSync("../data/gamemaster/gamemaster-app.json", 'utf8');
    let data = JSON.parse(buf);
    var templates = data;
    var pokemon = [];

    console.log(templates);

    for(var i = 0; i < data.length; i++){
        var template = data[i];

        if(! template.data.pokemonSettings){
            continue;
        }

        if( (template.templateId.indexOf("NORMAL") > -1) || (template.templateId.indexOf("SHADOW") > -1) || (template.templateId.indexOf("PURIFIED") > -1)){
            continue;
        }

        // Parse out the dex number from the template Id

        var dexStr = template.templateId.split("_");
        dexStr = dexStr[0].split("V0");
        var dexNumber = parseInt(dexStr[1]);

        var settings = template.data.pokemonSettings;
        var speciesId = settings.pokemonId.toLowerCase();

        if(settings.form){
            speciesId = settings.form.toLowerCase();
        }

        var speciesName = speciesId[0].toUpperCase() + speciesId.substring(1);

        // Gather fast moves and charged moves

        var fastMoves = [];
        var chargedMoves = [];

        // Catch for Smeargle, which doesn't have set moves
        if(settings.quickMoves){
            for(var n = 0; n < settings.quickMoves.length; n++){
                settings.quickMoves[n] = settings.quickMoves[n].replace("_FAST","");
            }

            fastMoves = settings.quickMoves;
            chargedMoves = settings.cinematicMoves;
        }

        // Gather Poekmon types
        var types = ["none", "none"];

        if(settings.type){
            types[0] = settings.type.replace("POKEMON_TYPE_","").toLowerCase();
        }

        if(settings.type2){
            types[1] = settings.type2.replace("POKEMON_TYPE_","").toLowerCase();
        }


        var poke = {
            dex: dexNumber,
            speciesName: speciesName,
            speciesId: speciesId,
            baseStats: {
                atk: settings.stats.baseAttack,
                def: settings.stats.baseDefense,
                hp: settings.stats.baseStamina
            },
            types: types,
            fastMoves: fastMoves,
            chargedMoves: chargedMoves,
            defaultIVs: {
                cp1500: [20, 15, 15, 15],
                cp2500: [20, 15, 15, 15]
            }
        };

        pokemon.push(poke);
    }

    console.log(JSON.stringify(pokemon));
    return pokemon;
}