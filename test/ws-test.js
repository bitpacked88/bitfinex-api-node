var expect = require('chai').expect,
    BFX = require('../index'),
    underscore = require('underscore');

bfx = new BFX();
var bfx_ws = bfx.ws;
describe('Websocket', function () {
    this.timeout(30000);
    it('subscribing',
        function (done) {
            bfx_ws.once('open', function () {
                bfx_ws.subTicker();
                bfx_ws.subTrades();
                bfx_ws.subBook();
                bfx_ws.subTicker("LTCUSD");
                bfx_ws.subTrades("LTCUSD");
                bfx_ws.subBook("LTCUSD");
                bfx_ws.send(JSON.stringify({
                    "event": "ping"
                }));
                setTimeout(function () {
                    done()
                }, 15000)
            });
        });
    it('should receive a pong', function () {
        underscore.find(bfx_ws.messages, function (v) {
            return v.event == 'pong'
        });
    });
    it('should map all the channels', function () {
        var values = Object.getOwnPropertyNames(bfx_ws.mapping).map(function (key) {
            return bfx_ws.mapping[key];
        });
        expect(values).to.include.members(['BTCUSD_ticker', 'BTCUSD_trades', 'BTCUSD_book']);
    });
    it('should receive info message',
        function () {
            expect(bfx_ws.messages).is.not.empty;
            expect(bfx_ws.messages.pop()).is.eql('ws opened...');
            expect(bfx_ws.messages.pop()).is.eql({'event': 'info', 'version': 1});
        });
    it('should receive sub success messages', function () {
        expect(bfx_ws.messages.filter(function (v) {
            return v.event == 'subscribed'
        }).length).is.eql(6)
    });
    it('the order snapshot should have the correct number of fields in the correct hierarchy', function () {
        var chan = underscore.invert(bfx_ws.mapping)["BTCUSD_book"];
        var book_snapshot = underscore.find(bfx_ws.messages.reverse(), function (v) {
            return v[0] == chan
        });
        expect(book_snapshot[0]).is.a.number;
        expect(book_snapshot[1]).is.an.array;
        expect(book_snapshot[1][0]).is.an.array;
        expect(book_snapshot[1][0].length).is.eql(3);
        expect(underscore.every(book_snapshot[1][0], function (v) {
            return underscore.isFinite(v)
        })).ok
    });
    it('the types, structure and amount of order updates should be correct', function () {
        var chan = underscore.invert(bfx_ws.mapping)["BTCUSD_book"];
        var book_update = underscore.find(bfx_ws.messages.reverse(), function (v) {
            return v[0] == chan
        });
        expect(underscore.every(book_update, function (v) {
            return underscore.isFinite(v)
        })).ok;
        expect(book_update.length).is.eql(4);
    });

    it('the trades snapshot should have the correct number of fields in the correct hierarchy', function () {
        var chan = underscore.invert(bfx_ws.mapping)["BTCUSD_trades"];
        var trades_snapshot = underscore.find(bfx_ws.messages.reverse(), function (v) {
            return v[0] == chan
        });
        expect(trades_snapshot[0]).is.a.number;
        expect(trades_snapshot[1]).is.an.array;
        expect(trades_snapshot[1][0]).is.an.array;
        expect(trades_snapshot[1][0].length).is.eql(4);
        expect(underscore.every(trades_snapshot[1][0], function (v) {
            return underscore.isFinite(v)
        })).ok
    });
    it.skip('the types, structure and amount of trade updates should be correct', function () {
        var chan = underscore.invert(bfx_ws.mapping)["BTCUSD_trades"];
        var trades_update = underscore.find(bfx_ws.messages, function (v) {
            return v[0] == chan
        });
        console.log(trades_update);
        expect(underscore.every(trades_update, function (v) {
            return underscore.isFinite(v)
        })).ok;
        expect(trades_update.length).is.eql(5);
    });
    this.mapping = bfx_ws.mapping;
    it('unsubscribing',
        function (done) {
            bfx_ws.unSubTickerPair();
            bfx_ws.unSubTradesPair();
            bfx_ws.unSubBookPair();
            bfx_ws.unSubTickerPair("LTCUSD");
            bfx_ws.unSubTradesPair("LTCUSD");
            bfx_ws.unSubBookPair("LTCUSD");
            setTimeout(function () {
                done()
            }, 2000)
        });
    it('should disconnect', function () {
        bfx_ws.close();
        var close_message = underscore.find(bfx_ws.messages, function (v) {
            return v = 'ws closed...'
        });
        expect(close_message).to.exist;
    });
    it('should handle errors properly', function () {
        var error = function(){bfx_ws.send(JSON.stringify({
            "event": "ping"
        }))};
        expect(error).to.throw(Error)
    })
});