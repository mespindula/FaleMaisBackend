var http = require('http'); 
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Enum = require('enum');

app.use(require("cors")());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());

const plansEnum = new Enum({30 : "FaleMais 30", 60 : "FaleMais 60", 120  : "FaleMais 120"},{ freeze: true })
const dddsEnum = new Enum({1 : "011", 2 : "016", 3 : "017", 4 : "018"},{ freeze: true })
const tariffEnum = new Enum({
    "011-016" : 1.9,
    "016-011" : 2.9,
    "011-017" : 1.7,
    "017-011" : 2.7,
    "011-018" : 0.9,
    "018-011" : 1.9
})

app.get('/', (req, res, next) => {
    res.json({message: "API Fale Mais - NodeJS", plans: plansEnum});
})

const cadastros = [];

app.get('/ddds', (req, res, next) => { 
    const ddds = [];

    dddsEnum.enums.forEach(function(enumItem) {
        ddds.push({"id": parseInt(enumItem.key), "value": enumItem.value})
    })

    res.json(ddds);
})

app.get('/plans', (req, res, next) => { 
    const plans = [];

    plansEnum.enums.forEach(function(enumItem) {
        plans.push({"id": parseInt(enumItem.key), "value": enumItem.value})
    })

    res.json(plans);
}) 

app.post('/tariff', (req, res, next) => {
	var dddSource = req.body.dddSource;
    var dddTarget = req.body.dddTarget;
    var time = req.body.time;
    var plan = req.body.plan;
	
	if (dddSource == "" || dddSource === undefined) {
		res.json({
			erro: "ddd origem não informado"
		});
	} else if (dddTarget == "" || dddTarget === undefined) {
		res.json({
			erro: "ddd destino não informado"
		});
	} else if (time == "" || time === undefined || isNaN(time)) {
		res.json({
			erro: "minutos não informado"
		});
	} else if (plan == "" || plan === undefined) {
		res.json({
			erro: "plano não informado"
		});
	}
	
	time = parseInt(time);
	
	var dddSourceEnum = dddsEnum.get(dddSource);
	var dddTargetEnum = dddsEnum.get(dddTarget);
	var planEnum = plansEnum.get(plan);
	
	if (dddSourceEnum === undefined) {
		res.json({
			erro: "ddd origem não encontrado"
		});
	} else if (dddTargetEnum === undefined) {
		res.json({
			erro: "ddd destino não encontrado"
		});
	} else if (planEnum === undefined) {
		res.json({
			erro: "plano não encontrado"
		});
	}
		
	var normalTariff = getNormalTariff(dddSourceEnum, dddTargetEnum, time);

	var faleMaisTarrif = getFaleMaisTarrif(dddSourceEnum, dddTargetEnum, time, planEnum);

	res.json({
		valorNormal: normalTariff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
		valorFaleMais: faleMaisTarrif.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
	});

})

getNormalTariff = function (dddSourceEnum, dddTargetEnum, time) {
    var dddSource = dddSourceEnum.value;
    var dddTarget = dddTargetEnum.value;

    var tariff = tariffEnum.get(dddSource+"-"+dddTarget) != undefined ? 
        tariffEnum.get(dddSource+"-"+dddTarget).value : 0;

    return time * tariff;
}

getFaleMaisTarrif = function (dddSourceEnum, dddTargetEnum, time, planEnum) {
    var excess = time - planEnum.key;
    
    if (excess > 0) {
        var normalTariff = getNormalTariff(dddSourceEnum, dddTargetEnum, excess);

        if (normalTariff > 0) {
            var dddSource = dddSourceEnum.value;
            var dddTarget = dddTargetEnum.value;
            var tariff = tariffEnum.get(dddSource+"-"+dddTarget) != undefined ? 
                (tariffEnum.get(dddSource+"-"+dddTarget).value * 0.1) : 0;

            return normalTariff + (excess * tariff);
        }
    }

    return 0;
}



var server = http.createServer(app); 
server.listen(3030);
console.log("Servidor escutando na porta 3030...")