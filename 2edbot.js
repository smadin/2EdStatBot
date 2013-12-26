var Twit = require('twit');
var express = require('express');
var app = express();

app.get('/', function(req, res){
    var stats;
    var rec;
    
    do {
        stats = rollattrs();
        rec = analyze(stats);
    } while (rec == -1);
    
    res.send(print_attrs(stats) + " (" + rec + ")");
});
app.listen(3000);

// insert your twitter app info here
var T = new Twit({
  consumer_key:         '', 
  consumer_secret:      '',
  access_token:         '',
  access_token_secret:  ''
});

var character = "";

function makeStats() {
    var stats;
    var rec;

    do {
        stats = rollattrs();
        rec = analyze(stats);
    } while (rec == -1);

    character = print_attrs(stats) + " (" + rec + ")";

    T.post('statuses/update', { status: character }, function (err, reply) {
        console.log("error: " + err);
        console.log("reply: " + reply);
    });
}

function print_attrs(attrs) {
    return "STR " + attrs['STR'] +
          " DEX " + attrs['DEX'] +
          " CON " + attrs['CON'] +
          " INT " + attrs['INT'] +
          " WIS " + attrs['WIS'] +
          " CHA " + attrs['CHA'];
}

function analyze(attrs) {
    var tuples = [];
    var max = 0;

    for (var attr in attrs) {
        tuples.push([attr, attrs[attr]]);
        if (attrs[attr] > max) max = attrs[attr];
    }

    tuples.sort(function(a,b) {
        a = a[1];
        b = b[1];
        return a - b;
    }).reverse();

    var tuplestr = "";
    for (var i = 0; i < tuples.length; i++) {
        if (tuplestr.length != 0) tuplestr += " ";
        tuplestr += tuples[i][0] + " " + tuples[i][1];
    }

    // minimum
    if (max < 9) {
        return -1;
    }

    // advanced classes
    if (attrs['STR'] >= 12 &&
        attrs['CON'] >= 9 &&
        attrs['WIS'] >= 13 &&
        attrs['CHA'] >= 17) {
        return "Paladin";
    } else if (attrs['STR'] >= 13 &&
               attrs['DEX'] >= 13 &&
               attrs['INT'] >= 14 &&
               attrs['WIS'] >= 14) {
        return "Ranger";
    } else if (attrs['WIS'] >= 12 &&
               attrs['CHA'] >= 15) {
        return "Druid";
    } else if (attrs['DEX'] >= 12 &&
               attrs['INT'] >= 13 &&
               attrs['CHA'] >= 15) {
        return "Bard";
    }

    // standard classes
    var highest = tuples[0][0];
    var second = tuples[1][0];
    var secondval = tuples[1][1];
    var third = tuples[2][0];
    var thirdval = tuples[2][1];
    if (highest == 'STR') {
        return "Fighter";
    } else if (highest == 'DEX') {
        return "Thief";
    } else if (highest == 'INT') {
        return "Mage";
    } else if (highest == 'WIS') {
        return "Cleric";
    } else {
        if (second == 'STR' && secondval >= 9) {
            return "Fighter";
        } else if (second == 'DEX' && secondval >= 9) {
            return "Thief";
        } else if (second == 'INT' && secondval >= 9) {
            return "Mage";
        } else if (second == 'WIS' && secondval >= 9) {
            return "Cleric";
        } else {
            if (third == 'STR' && thirdval >= 9) {
                return "Fighter";
            } else if (third == 'DEX' && thirdval >= 9) {
                return "Thief";
            } else if (third == 'INT' && thirdval >= 9) {
                return "Mage";
            } else if (third == 'WIS' && thirdval >= 9) {
                return "Cleric";
            }
        }
    }

    return -1;
}

function rollattrs() {
    return {
        'STR' : roll(),
        'DEX' : roll(),
        'CON' : roll(),
        'INT' : roll(),
        'WIS' : roll(),
        'CHA' : roll()
    };
}

function roll() {
    var roll1 = Math.floor(Math.random() * 6) + 1;
    var roll2 = Math.floor(Math.random() * 6) + 1;
    var roll3 = Math.floor(Math.random() * 6) + 1;
    return roll1 + roll2 + roll3;
}

function favRTs () {
  T.get('statuses/retweets_of_me', {}, function (e,r) {
    for(var i=0;i<r.length;i++) {
      T.post('favorites/create/'+r[i].id_str,{},function(){});
    }
    console.log('harvested some RTs'); 
  });
}

// every 10 minutes, roll and tweet a set of stats
// wrapped in a try/catch in case Twitter is unresponsive, don't really care about error
// handling. it just won't tweet.
setInterval(function() {
  try {
    makeStats();
  }
 catch (e) {
    console.log(e);
  }
},60000*10);

// every 5 hours, check for people who have RTed a tweet, and favorite that tweet
setInterval(function() {
  try {
    favRTs();
  }
 catch (e) {
    console.log(e);
  }
},60000*60*5);
