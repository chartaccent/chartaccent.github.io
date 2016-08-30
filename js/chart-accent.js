var ChartAccent = ((function() {
    var Module = { };

FONT_chartaccent_icons = {"chartaccent-icons-font-smaller": "\ue014", "chartaccent-icons-annotation": "\ue000", "chartaccent-icons-checkbox-checked": "\ue007", "chartaccent-icons-line-start": "\ue01b", "chartaccent-icons-minus": "\ue01d", "chartaccent-icons-circles": "\ue00b", "chartaccent-icons-shape-label": "\ue028", "chartaccent-icons-range": "\ue024", "chartaccent-icons-line-none": "\ue019", "chartaccent-icons-range-without": "\ue023", "chartaccent-icons-plus": "\ue01f", "chartaccent-icons-item-label": "\ue015", "chartaccent-icons-checkbox-correct-empty": "\ue009", "chartaccent-icons-range-within": "\ue022", "chartaccent-icons-line-above": "\ue016", "chartaccent-icons-arrow-right": "\ue003", "chartaccent-icons-line-start-end": "\ue01a", "chartaccent-icons-region": "\ue025", "chartaccent-icons-edit": "\ue011", "chartaccent-icons-shape-line": "\ue029", "chartaccent-icons-lines": "\ue01c", "chartaccent-icons-font-larger": "\ue013", "chartaccent-icons-arrow-left": "\ue002", "chartaccent-icons-blank": "\ue006", "chartaccent-icons-shape-arrow": "\ue026", "chartaccent-icons-preset": "\ue020", "chartaccent-icons-bars": "\ue005", "chartaccent-icons-arrow-up": "\ue004", "chartaccent-icons-arrow-down": "\ue001", "chartaccent-icons-digits-more": "\ue010", "chartaccent-icons-checkbox-empty": "\ue00a", "chartaccent-icons-shape-oval": "\ue02a", "chartaccent-icons-trendline": "\ue02d", "chartaccent-icons-digits-less": "\ue00f", "chartaccent-icons-shape-rect": "\ue02b", "chartaccent-icons-line-below": "\ue017", "chartaccent-icons-correct": "\ue00c", "chartaccent-icons-slash": "\ue02c", "chartaccent-icons-range-line": "\ue021", "chartaccent-icons-more": "\ue01e", "chartaccent-icons-checkbox-correct-checked": "\ue008", "chartaccent-icons-eye": "\ue012", "chartaccent-icons-line-end": "\ue018", "chartaccent-icons-cross-small": "\ue00d", "chartaccent-icons-shape-image": "\ue027", "chartaccent-icons-cross": "\ue00e"};

// Make an object capable for accepting events.
// Binding behaviour is similar to d3.
// on("event.handler_name", handler)
// raise("event", arg1, arg2, ...)
var EventManager = function() {
    this.handlers = new WeakMap();
};

EventManager.prototype.on = function(obj, eventname, callback) {
    var split = eventname.split(".");
    if(!split[1]) split[1] = "";
    if(!this.handlers.has(obj)) {
        var handlers = { };
        this.handlers.set(obj, handlers);
    } else {
        var handlers = this.handlers.get(obj);
    }
    if(!handlers[split[0]]) {
        handlers[split[0]] = { };
    }
    if(callback === undefined) {
        return handlers[split[0]][split[1]];
    }
    if(callback === null) {
        delete handlers[split[0]][split[1]];
    } else {
        handlers[split[0]][split[1]] = callback;
    }
};

EventManager.prototype.raise = function(obj, event) {
    if(!this.handlers.has(obj)) return;
    var handlers = this.handlers.get(obj);
    for (var k in handlers[event]) {
        handlers[event][k].apply(obj, Array.prototype.slice.call(arguments, 2));
    }
};

Module.EventManager = EventManager;

var Events = new EventManager();
Module.Events = Events;

EventManager.Test = function(test) {
    var EM = new EventManager();
    var o = { };
    var k1 = null, k2 = null;
    var f1 = function(a, b, c) { k1 = a + b + c; };
    var f2 = function(a, b, c) { k2 = a + b - c; };
    EM.on(o, "test", f1);
    EM.on(o, "test.map", f2);
    EM.raise(o, "test", 1, 2, 3);
    test.ok(k1 == 6 && k2 == 0, "test1");
    test.ok(EM.on(o, "test") == f1, "test2");
    var k1 = null, k2 = null;
    EM.on(o, "test", null);
    EM.raise(o, "test", 1, 2, 3);
    test.ok(k1 === null && k2 == 0, "test3");
    test.done();
};

DependencyManager = function() {
    this.registry = new WeakMap();
};

DependencyManager.prototype._getRegistry = function(obj) {
    if(this.registry.has(obj)) return this.registry.get(obj);
    // As default, initially an object is not valid.
    var item = {
        v: false,        // Is valid.
        u: new Set(),    // Upstreams.
        d: new Set()     // Downstreams.
    };
    this.registry.set(obj, item);
    return item;
};
// Add a dependency.
DependencyManager.prototype.add = function(obj, upstream) {
    this._getRegistry(obj).u.add(upstream);
    this._getRegistry(upstream).d.add(obj);
};
// Remove a dependency.
DependencyManager.prototype.remove = function(obj, upstream) {
    this._getRegistry(obj).u.delete(upstream);
    this._getRegistry(upstream).d.delete(obj);
};
// // Remove an object.
// exclude: function(obj) {
//     if(!this.registry.has(obj)) return;
//     this._getRegistry(obj).u.forEach(item.d.delete, item.d);
//     this.registry.delete(obj);
// },
// Evaluate the value on obj.
DependencyManager.prototype.validate = function(obj) {
    var self = this;
    var reg = this._getRegistry(obj);
    if(reg.v) return;
    reg.u.forEach(function(upstream) {
        self.validate(upstream);
        var reg_upstream  = self._getRegistry(upstream);
        reg_upstream.d.add(obj);
    });
    if(obj.validate) obj.validate();
    reg.v = true;
};
// Invalidate the value on obj.
DependencyManager.prototype.invalidate = function(obj) {
    var self = this;
    var reg = this._getRegistry(obj);
    if(reg.v === true) {
        reg.v = false;
        reg.d.forEach(this.invalidate, this);
        reg.d.clear();
    }
};

var DM = new DependencyManager();

DependencyManager.Test = function(test) {
    var actionlist = [];
    var o1 = { validate: function() { actionlist.push("1"); } }
    var o2 = { validate: function() { actionlist.push("2"); } }
    var o3 = { validate: function() { actionlist.push("3"); } }
    var o4 = { validate: function() { actionlist.push("4"); } }
    DM.add(o1, o2);
    DM.add(o1, o3);
    DM.add(o2, o3);
    DM.add(o3, o4);
    DM.add(o2, o4);

    DM.validate(o1);
    test.ok(actionlist.join(",") == "4,3,2,1");

    actionlist = [];
    DM.invalidate(o3);
    DM.validate(o1);
    test.ok(actionlist.join(",") == "3,2,1");

    actionlist = [];
    DM.remove(o3, o4);
    DM.remove(o2, o4);
    DM.invalidate(o4);
    DM.validate(o1);
    test.ok(actionlist.join(",") == "");
    test.done();
};

Module.DependencyManager = DependencyManager;

var Geometry = {
    vectorLength: function(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    },
    pointPointDistance: function(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
    },
    pointLineSegmentDistance: function(p, p1, p2) {
        var p2_p1 = new Geometry.Vector(p2.x - p1.x, p2.y - p1.y);
        var distance = p2_p1.length();
        if(distance < 1e-6) {
            return Geometry.pointPointDistance(p, p1);
        }
        var p_p1 = new Geometry.Vector(p.x - p1.x, p.y - p1.y);
        var proj_distance = p_p1.dot(p2_p1) / distance;
        var value = p_p1.cross(p2_p1) / distance;
        if(proj_distance < 0) {
            return Geometry.pointPointDistance(p, p1);
        } else if(proj_distance <= distance) {
            return Math.abs(value);
        } else {
            return Geometry.pointPointDistance(p, p2);
        }
    },
    pointLineSegmentSignedDistance: function(p, p1, p2) {
        var p2_p1 = new Geometry.Vector(p2.x - p1.x, p2.y - p1.y);
        var distance = p2_p1.length();
        if(distance < 1e-6) {
            return Geometry.pointPointDistance(p, p1);
        }
        var p_p1 = new Geometry.Vector(p.x - p1.x, p.y - p1.y);
        var proj_distance = p_p1.dot(p2_p1) / distance;
        var value = p_p1.cross(p2_p1) / distance;
        if(proj_distance < 0) {
            return value > 0 ? Geometry.pointPointDistance(p, p1) : -Geometry.pointPointDistance(p, p1);
        } else if(proj_distance <= distance) {
            return value;
        } else {
            return value > 0 ? Geometry.pointPointDistance(p, p2) : -Geometry.pointPointDistance(p, p2);
        }
    },
    pointPathDistance: function(p) {
        var min_d = null;
        for(var i = 1; i < arguments.length - 1; i++) {
            var p1 = arguments[i];
            var p2 = arguments[i + 1];
            var d = Geometry.pointLineSegmentDistance(p, p1, p2);
            if(min_d === null || min_d > d) {
                min_d = d;
            }
        }
        return min_d;
    },
    pointClosedPathDistance: function(p) {
        var min_d = null;
        for(var i = 1; i < arguments.length; i++) {
            var p1 = arguments[i];
            if(i == arguments.length - 1) {
                var p2 = arguments[1];
            } else {
                var p2 = arguments[i + 1];
            }
            var d = Geometry.pointLineSegmentDistance(p, p1, p2);
            if(min_d === null || min_d > d) {
                min_d = d;
            }
        }
        return min_d;
    },
    pointRectDistance: function(p, p00, p01, p11, p10) {
        if(Geometry.pointInsidePolygon(p, [p00, p01, p11, p10])) return 0;
        return Geometry.pointClosedPathDistance(p, p00, p01, p11, p10);
    },
    pointInsidePolygon: function(point, polygon) {
        for(var c = false, i = -1, l = polygon.length, j = l - 1; ++i < l; j = i) {
            if( ((polygon[i].y <= point.y && point.y < polygon[j].y) || (polygon[j].y <= point.y && point.y < polygon[i].y))
             && (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)
            ) {
                c = !c;
            }
        }
        return c;
    },
    isLineSegmentsIntersect: function(l11, l12, l21, l22) {
        var A0 = l11.x, B0 = l11.y;
        var A1 = l12.x, B1 = l12.y;
        var A2 = l21.x, B2 = l21.y;
        var A3 = l22.x, B3 = l22.y;
        var judge1 = ((A2-A0)*(B1-B0) - (B2-B0)*(A1-A0)) * ((A3-A0)*(B1-B0) - (B3-B0)*(A1-A0)) < 0;
        var judge2 = ((A0-A2)*(B3-B2) - (B0-B2)*(A3-A2)) * ((A1-A2)*(B3-B2) - (B1-B2)*(A3-A2)) < 0;
        return judge1 && judge2;
    },
    isPolygonIntersect: function(polygon1, polygon2) {
        for(var i = 0; i < polygon1.length; i++) {
            if(Geometry.pointInsidePolygon(polygon1[i], polygon2)) return true;
        }
        for(var i = 0; i < polygon1.length; i++) {
            for(var j = 0; j < polygon2.length; j++) {
                var p1 = polygon1[i];
                var p2 = polygon1[(i + 1) % polygon1.length];
                var q1 = polygon2[j];
                var q2 = polygon2[(j + 1) % polygon2.length];
                if(Geometry.isLineSegmentsIntersect(p1, p2, q1, q2)) return true;
            }
        }
        return false;
    },
    minimalSpanningTree: function(points) {
        var edges = [];
        var parents = new Array(points.length);
        for(var i = 0; i < points.length; i++) {
            parents[i] = i;
            for(var j = i + 1; j < points.length; j++) {
                edges.push([ Geometry.pointPointDistance(points[i], points[j]), i, j ]);
            }
        }
        edges.sort(function(a, b) { return a[0] - b[0]; });

        var get_parent = function(p) {
            if(parents[p] != p) {
                parents[p] = get_parent(parents[p]);
            }
            return parents[p];
        };
        var tree_edges = [];
        for(var i = 0; i < edges.length; i++) {
            var p1 = edges[i][1];
            var p2 = edges[i][2];
            if(get_parent(p1) == get_parent(p2)) {
            } else {
                parents[get_parent(p1)] = get_parent(p2);
                tree_edges.push([p1, p2]);
            }
        }
        return tree_edges;
    }
};

Geometry.Vector = function(x, y) {
    this.x = x;
    this.y = y;
};
Geometry.Vector.prototype.sub = function(v2) {
    return new Geometry.Vector(this.x - v2.x, this.y - v2.y);
};
Geometry.Vector.prototype.add = function(v2) {
    return new Geometry.Vector(this.x + v2.x, this.y + v2.y);
};
Geometry.Vector.prototype.scale = function(s) {
    return new Geometry.Vector(this.x * s, this.y * s);
};
Geometry.Vector.prototype.dot = function(v2) {
    return this.x * v2.x + this.y * v2.y;
};
Geometry.Vector.prototype.cross = function(v2) {
    return this.x * v2.y - this.y * v2.x;
};
Geometry.Vector.prototype.length = function(v2) {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
Geometry.Vector.prototype.clone = function() {
    return new Geometry.Vector(this.x, this.y);
};

Geometry.Path = {
    polyline: function() {
        return "M" + Array.prototype.slice.call(arguments).map(function(d) {
            return d.x + "," + d.y;
        }).join("L");
    },
    polylineClosed: function() {
        return Geometry.Path.polyline.apply(null, arguments) + "Z";
    },
    rect: function(x, y, w, h) {
        return Geometry.Path.polylineClosed(
            new Geometry.Vector(x, y),
            new Geometry.Vector(x + w, y),
            new Geometry.Vector(x + w, y + h),
            new Geometry.Vector(x, y + h)
        );
    },
    commands: function() {
        return Array.prototype.slice.call(arguments).map(function(d) {
            return d[0] + " " + d.slice(1).join(",");
        }).join(" ");
    },
    arrow: function(size, p1, p2) {
        // Arrow from p1 to p2, with size.
        var direction = p1.sub(p2);
        direction = direction.scale(1.0 / direction.length() * size);
        direction_rot90 = new Geometry.Vector(-direction.y, direction.x).scale(0.4);
        return Geometry.Path.polylineClosed(
            p2,
            p2.add(direction).add(direction_rot90),
            p2.add(direction).sub(direction_rot90)
        )
    },
    tabV: function(y1, y2, width, roundness) {
        if(y1 > y2) { var t = y1; y1 = y2; y2 = t; }
        if(roundness > (y2 - y1) / 2) roundness = (y2 - y1) / 2;
        return Geometry.Path.commands(
            ["M", 0, y1],
            ["L", width - roundness * Math.sign(width), y1],
            ["A", roundness, roundness, 0, 0, 1, width, y1 + roundness],
            ["L", width, y2 - roundness],
            ["A", roundness, roundness, 0, 0, 1, width - roundness * Math.sign(width), y2],
            ["L", 0, y2],
            ["Z"]
        );
    },
    tabH: function(y1, y2, width, roundness) {
        if(y1 > y2) { var t = y1; y1 = y2; y2 = t; }
        if(roundness > (y2 - y1) / 2) roundness = (y2 - y1) / 2;
        return Geometry.Path.commands(
            ["M", y1, 0],
            ["L", y1, width - roundness * Math.sign(width)],
            ["A", roundness, roundness, 0, 0, 1, y1 + roundness, width],
            ["L", y2 - roundness, width],
            ["A", roundness, roundness, 0, 0, 1, y2, width - roundness * Math.sign(width)],
            ["L", y2, 0],
            ["Z"]
        );
    }
};

// Helper functions for d3.js scale.

var Scales = { };

Scales.getScaleRangeExtent = function(scale) {
    if(scale.rangeExtent) {
        return scale.rangeExtent();
    } else {
        return scale.range();
    }
};
Scales.getScaleInverseClamp = function(scale, position, pair_value) {
    var v = Scales.getScaleInverse(scale, position, pair_value);
    if(scale.rangeExtent) return v;
    var domain = scale.domain();
    var min = Math.min(domain[0], domain[1]);
    var max = Math.max(domain[0], domain[1]);
    if(v < min) v = min;
    if(v > max) v = max;
    return v;
};
Scales.getScaleInverseClampSnap = function(scale, position, pair_value) {
    var v = Scales.getScaleInverse(scale, position, pair_value);
    if(scale.rangeExtent) return v;
    var domain = scale.domain();
    var min = Math.min(domain[0], domain[1]);
    var max = Math.max(domain[0], domain[1]);
    if(v < min) v = min;
    if(v > max) v = max;
    var ticks = scale.ticks();
    var tick_diff = Math.abs(ticks[1] - ticks[0]);
    var dmin = null;
    var tickmin = null;
    for(var k = 0; k < ticks.length; k++) {
        var d = Math.abs(v - ticks[k]);
        if(dmin === null || d < dmin) {
            dmin = d;
            tickmin = ticks[k];
        }
    }
    if(dmin < tick_diff * 0.15) {
        v = tickmin;
    } else {
        var tick_range = Math.ceil(Math.log(Math.abs(ticks[ticks.length - 1] - ticks[0])) / Math.log(10));
        tick_range = Math.pow(10, tick_range);
        v = parseFloat((v / tick_range).toFixed(3)) * tick_range;
    }
    return v;
};
Scales.getNextValue = function(scale, value) {
    if(scale.rangeExtent) {
        if(isObject(value)) return value.min;
        var idx = scale.domain().indexOf(value);
        if(idx < 0) return null;
        return scale.domain()[idx + 1];
    } else {
        return value;
    }
};
Scales.getPreviousValue = function(scale, value) {
    if(scale.rangeExtent) {
        if(isObject(value)) return value.max;
        var idx = scale.domain().indexOf(value);
        if(idx < 0) return null;
        return scale.domain()[idx - 1];
    } else {
        return value;
    }
};
Scales.getScaleInverse = function(scale, position, pair_value) {
    if(scale.rangeExtent) {
        var band = scale.rangeBand();
        var range = scale.range().map(function(v) { return v + band / 2; });
        var spacing = range[1] - range[0];
        var min_d = null;
        var min_i = null;
        if(pair_value === undefined || typeof(pair_value) == "string") {
            for(var i = 0; i < range.length; i++) {
                var d = Math.abs(range[i] - position);
                if(min_d === null || d < min_d) {
                    min_d = d;
                    min_i = i;
                }
            }
        }
        // Extended range.
        var ext_range = [];
        ext_range.push(range[0] - spacing / 2);
        for(var i = 0; i < range.length - 1; i++) {
            ext_range.push((range[i] + range[i + 1]) / 2);
        }
        ext_range.push(range[range.length - 1] + spacing / 2);
        if(pair_value === undefined || typeof(pair_value) == "object") {
            for(var i = 0; i < ext_range.length; i++) {
                var d = Math.abs(ext_range[i] - position);
                if(min_d === null || d < min_d) {
                    min_d = d;
                    min_i = [ i - 1, i ];
                }
            }
        }
        if(min_i === null) return null;
        if(isArray(min_i)) {
            return {
                min: scale.domain()[min_i[0]],
                max: scale.domain()[min_i[1]],
                toString: function() {
                    if(this.min && this.max) {
                        return "Between " + this.min + "," + this.max;
                    } else if(this.min) {
                        return "After " + this.min;
                    } else {
                        return "Before " + this.max;
                    }
                },
                toFixed: function() {
                    return this.toString();
                }
            };
        } else {
            return scale.domain()[min_i];
        }
    } else {
        return scale.invert(position);
    }
};

Scales.getScale = function(scale, value) {
    if(isObject(value)) {
        var range = scale.range();
        var spacing = range[1] - range[0];
        if(value.min) {
            return scale(value.min) + (spacing + scale.rangeBand()) / 2;
        } else if(value.max) {
            return scale(value.max) - (spacing - scale.rangeBand()) / 2;
        }
        return [ v, v ];
    } else {
        return scale(value);
    }
};

Scales.getScaleValueRange = function(scale, value) {
    if(scale.rangeExtent) {
        var range = scale.range();
        var spacing = range[1] - range[0];
        var margin = (spacing - scale.rangeBand()) / 2 - 2;
        if(!isArray(value)) {
            if(isObject(value)) {
                var v = Scales.getScale(scale, value);
                return [ v, v ];
            } else {
                var v = scale(value);
            }
            return [ v - margin, v + scale.rangeBand() + margin ];
        } else {
            var v0 = Scales.getScale(scale, value[0]);
            var v1 = Scales.getScale(scale, value[1]);
            if(v1 >= v0) return [ v0 - margin, v1 + scale.rangeBand() + margin];
            else return [ v0 + scale.rangeBand() - margin, v1 + margin ];
        }
    } else {
        if(!isArray(value)) {
            var v = scale(value);
            return [ v, v ];
        } else {
            return [ scale(value[0]), scale(value[1]) ];
        }
    }
};

Scales.isScaleNumerical = function(scale) {
    return !scale.rangeExtent;
};

var RGBColor = function(r, g, b, a) {
    if(r instanceof RGBColor) {
        this.r = r.r;
        this.g = r.g;
        this.b = r.b;
        this.a = r.a;
    } else if(typeof(r) == "string") {
        var str = r.trim();
        if(str.substr(0, 1) == "#") {
            if(str.length == 7) {
                this.r = parseInt(str.substr(1, 2), 16);
                this.g = parseInt(str.substr(3, 2), 16);
                this.b = parseInt(str.substr(5, 2), 16);
                this.a = g === undefined ? 1.0 : parseFloat(g);
                return;
            } else if(str.length == 4) {
                this.r = parseInt(str.substr(1, 1), 16) * 0x11;
                this.g = parseInt(str.substr(2, 1), 16) * 0x11;
                this.b = parseInt(str.substr(3, 1), 16) * 0x11;
                this.a = g === undefined ? 1.0 : parseFloat(g);
                return;
            }
        } else if(str.substr(0, 5) == "rgba(") {
            var value = str.substr(5, str.length - 5 - 1)
                .split(",").map(function(s) { return s.trim(); });
            this.r = parseInt(value[0]);
            this.g = parseInt(value[1]);
            this.b = parseInt(value[2]);
            this.a = parseFloat(value[3]);
            if(this.a > 1) this.a = 1;
            if(this.a < 0) this.a = 0;
            return;

        } else if(str.substr(0, 4) == "rgb(") {
            var value = str.substr(4, str.length - 4 - 1)
                .split(",").map(function(s) { return s.trim(); });
            this.r = parseInt(value[0]);
            this.g = parseInt(value[1]);
            this.b = parseInt(value[2]);
            this.a = g === undefined ? 1.0 : parseFloat(g);
            return;
        }
        throw new Error("invalid color");
    } else {
        this.r = r !== undefined ? parseInt(r) : 0;
        this.g = g !== undefined ? parseInt(g) : 0;
        this.b = b !== undefined ? parseInt(b) : 0;
        this.a = a !== undefined ? parseFloat(a) : 1.0;
        if(this.a > 1) this.a = 1;
        if(this.a < 0) this.a = 0;
    }
};

RGBColor.prototype.clone = function() {
    return new RGBColor(this.r, this.g, this.b, this.a);
};

RGBColor.prototype.over = function(dest) {
    var a = this.a + dest.a * (1 - this.a);
    if(a == 0) {
        return new RGBColor(0, 0, 0, 0);
    } else {
        var r = (this.r * this.a + dest.r * dest.a * (1 - this.a)) / a;
        var g = (this.g * this.a + dest.g * dest.a * (1 - this.a)) / a;
        var b = (this.b * this.a + dest.b * dest.a * (1 - this.a)) / a;
        return new RGBColor(r, g, b, a);
    }
};

RGBColor.prototype.mix = function(color2, t) {
    return new RGBColor(
        this.r + t * (color2.r - this.r),
        this.g + t * (color2.g - this.g),
        this.b + t * (color2.b - this.b),
        this.a + t * (color2.a - this.a)
    );
};

RGBColor.prototype.brighter = function(t) {
    if(t > 0) {
        return this.mix(new RGBColor(255, 255, 255, 1), t);
    } else {
        return this.mix(new RGBColor(0, 0, 0, 1), -t);
    }
};

RGBColor.prototype.toString = function(alpha) {
    if(alpha !== undefined) {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + alpha + ")";
    } else {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }
};

RGBColor.prototype.clone = function() {
    return new RGBColor(this.r, this.g, this.b, this.a);
};

var Colors = {
    selection_hint_color: new RGBColor("#ff7f0e"),
    selection_hint_fill_color: new RGBColor("#888")
};

Module.setColor = function(key, value) {
    Colors[key] = new RGBColor(value);
};

var Images = { };

(function() {
var image = "iVBORw0KGgoAAAANSUhEUgAAAQsAAADICAYAAAD/XsT8AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAADIdJREFUeNrs3etr1EocxvEcu7ZUVBTrhYoXFAstCoL//4vzBxR8IYjKipf1Uq0oVltarR6ewOyZzk6SyW4uk+T7gaJtt2madp78ZjKZjMbj8d8EAPL9e4pjACAEYQGAsABAWAAgLADEaJSZIqdOJUtLSxwhYEB+/fpVPiwUFKPRiKMHEBZ0QwCEIywAEBYACAsAhAUAwgIAYQGAsAAAwgIAYQGAsABAWAAgLAAQFgAICwAgLAAQFgCq1LmlsPb395PJZMJvDp21urqa3Lhxg7Co2/HxcbK3t8dfHEA3BABhAYCwAEBYAABhASBMr54idO7cuWRjY4PfKqKwvb1NZQGAbggAEBYACAsAhAUAwgIAYQGAsABAWAAAYQGAsABAWAAgLAAQFgAICwCEBQBkGHEIiunxA8+ePUu2trY4GHPS4xv09uPHj/TZLzqmLi1etLy8nP574cKFZGlpiQNHWHTLzs5OcnBwkHz58iW5dOkSB6REyOrY6bgdHR0FBYro9aJjrTeFBwiLTvzBf/r0Kf3/+/fvCYtAOlY6br4KIpRCQ2+qMvQEL1UdICyirirMH7zOjlQX+dTFePXqVVqJVeXbt29p1bG+vp5cuXKFg9wSBjhzKBxMVWGfMZFdCTx//rzSoLArvLdv36ZBBMIiylLaLaNNdYHZoFBDXqTbUeb7gLCIqqrICgWqi9luQpMNmMAgLKKrKuYJkiGGahsNV8ff7SKCsIiqqsjrogxRE12PLBrD0IAqCItWG0BIoOhKyZApUM3ciLZMJhP+YAmLdpiZhiEWnUfQ565ajL8vEBaV+vDhQ/BrzQzFoVYVIbMyY/udgbBo7Sw11OoippDU7yyW4CIsqCqoLpyfuY6JV4vQ5VsQFo2V1fP2fYdWXcTYMAkLwqIxiwzWDa26ODw8jG6fuIRKWDRWVSza5x1SdaE1KWLsGoGwiLqqGGp1ESMuoRIWtVJFUNVI+tDnXYCw6C017ConFlFdgLDoKXthmyorFaoLEBY9qyrquGuR6qI9rNVJWHSmqhhKdXH27Nno9omVwAmLWviWy6O6CHfmzBmqCsJiGJpYi6LP1UWMDZOwICxqqSqaWOWqz9WFSn4tzx+T2PaHsOhJVdGUKqsLs7o1jdO/LzxThLDoZFVRR3Wh1bsUPrHMUtSzU2JpoDxLhLCoXBsLy1YxQ1R3VJq7KmNa1VpPCWubxioYryAsKtXW8muLzhLV19sBoeCJ5VEEKv/bbKgaO7l9+zatmLCoVptLry1yV6tv9ewq72dZ1N27d1ub48DzTwmL3lQVtnmqAbv74VYbsQx2Kig2NjYaDwzzhHUQFr2pKuatLtzuhy9IYhns1CStJscvFBJ0PwiLWhppLI2qTHWhyqHosmubD/jxNeDNzc3aKwxd+SAoCItoyv+2qwuFW8gl3tgedKQKY2trq5ZBT4WQxkdiuAJDWPS0qohtifii8Crqfvi6WDH9jBpw1BiGzv5VVRmqWh48eMAszZaNqCqaD7D19fXMUXztc9nGr3BRA42JGrgat8ZWVP2UfXSAmVKed6xAWFQipsuLvkDw9bvV/Zjnblh9nRplbGdeNXhz1UK/CzMoq+rJHUdSIKysrKS3vzPRirBoTNXL5TVRXZTtfrg0IKoGFuu6DvpZNTjJ1GzGLKJS58I2dXWR5ul+2HiqOwiLOaqKOhe2qbK6MOEwb/fDpcFOHrYDwqJHVYVbXVR5c9hkMuGvGrXo1ZiFHqvXpTOrmUtR5UCsmaPBVGhQWRT027u2lF0d62uEzP4EBt8NQfxXg0BYICIaMGWwE4QFgjDYCcICQaq6JAsQFgPQxDNSQFigB2J7hAAIC0QspgWAQFggclQXICwQROtJ9GWwM4YFmIdoxCEYDg12ahp4rLex5zErnevNHrDVbfmsgUFYoGJmzQytZdmFfbUDoqjKMCu4Ex6EBSo8Q6txxdiQQgMipItCeBAWqICqCy2AGwOz3N7u7m7pdToJD8ICDTRQjV9oab8+BgThQVigQroysra21tjK2bqpTfM9FBIxLaRMeBAWCBgf0NyLOgc7Yw0IwoOwQEl1DHaawUlttysBMW946AlsXbwMTVhgLlUMdmbNgegjNzxWV1enVUfMj2IgLLCweQY77Uuc5qFBQ6UBWnt2rB0ehAV6R2fJosHOKuZADDE8CAv0sjviPi/VXOI0FQSGjbDAtC+uUNCgXVtzIEBYoCPG4zEHAZm4RR0AYQGAsABAWAAgLAAQFgAICwAgLAAQFgAICwCEBQDCAgBhAYCwAADCAgBhAYCwAEBYACAsABAWAAgLACAsABAWACrVueeG6MGzfXyOJIZDz0MlLBqgJ2a5j9kDQDcEAGEBgLAAQFgAICwAgLAAQFgAaMCIQ7C4w8PD5MmTJ9P3V1ZWkvv373NgQGUBgLAAAMICAGEBgLAAQFgA6AwunTZod3c3ef369fT9R48eTf//8ePH9PO6DGtcvHhx+mbb399Pvn//nrx79+7Ex9fW1pLz58/PvD6P2Zb7vUXLAWhb2qb+X0bWPl67di1dj0TblBcvXqSvk+vXr6efDz2W2l8dN5v2V/sauh0QFp2hhvLy5cvk+Ph45nNfv35N3xQCt27dSj+mxuc2ELsB6c1+fRZ9PwWXtp/X4PWm76nGffPmzXQOSRFtV/vho33Xmxr1nTt35jpeb968mQk295hpn8uEDwiL6INCZ9aQs6gaqRpuXuN2X5/VUBQUT58+zWxweft679693MCwK4U8+jlCfva8yqyIAmNvby/dZxAWnWYaixqfqgHTuNWYJ5PJibOzXc67rzdnbPs1ev/y5cvpMoQubdsOCt/2fF0jU/ZnVS2qkOygUHdA+6Bt2w3+8+fP025KKIWLGxTarrZvd5HcfTaV2zxVDE5igLNl+kPf3Nw80VDVwNUg7UaW93ozFmA3YgWOrzHq43YIKSh05vVVIfqYvpddSWRVNvpe9ufUbdHXuj+D3tfHzZhFCNNlsqnx6+d1x1LMPtsf136VCSYQFtFRKOiP3nf2Nw3Olfd6NUT7czp7u37+/DnzNXndCm3PbvBquL7xlZ2dnZmfK48+HzL+IapE7O+psYi8QVzf97f3D4RF5+gPPq/BuJ8ren3arxz937P8/fv3zOePjo4KAylvm77tul2KrO5PXgjlsQd088Zi3GNnb1/75ws5MGbRCUUN1W1wZS9fZlUfoY00L3TcLogbaiEUKu6lVd+27UZe5rKwjq/d5VJVVab7AyqLaISW4Vln+CaosWVdqjV88zNCu2FFFYjblSpzzNzXulUVqCw6NWbRNp21NSZgaDDQN9aRx26EZQPQXBIODSINdJa5fFqmQgJhgZyKocxci5BGWDYAi6olxhkIC7RI8w5CJndpIFFnfoVB3tiC3aCr7ioRFoQFWqJG7waFfeXAd6WhaMzCribKlvpFlc3y8vKJ97Pmn4CwQIV8N15pPkKZKwxFXYmylUBRWBRdtkVzuBoyILpPwlY0uSmUffVDjT80MEJmVboDpmUHX0FlgTm4Z+XQS5xuyOR1Q8TcKVskZNxEt7OXDRi7+2SPtTx8+DCKK1BUFuilkPsq3OrEvhSbRRVC1m3sbmVhT6RS1VI0hmJeZ29f2yAoCAsEckv6osbqu9MzpEGbNTDyxil0RSbU1atXZyqGou6Itm+Ph7jbAGGBHO7Z1awp4TY8NUZ93CzK456RfYOSWhjH3YZ7y7qpCuy1NELO9tpv+yqNWY/DN09EH9MDn+zvq69lmjdjFijB3Ppun9XVqPK6GRrX0BUT+4lrZh0O3dpuGqG51d1e0MasWpVFjTh0XQsNxmrMxV3jo+jeEu2fvhZUFiipzHJ2amRmPYuQM7NeU7SSlqEBUG2/zAxSBV3RcoHu/rNKFpUFFgwMPYtVZ32V7falTjV4XYFwJ2epm6G1L00VoCrFFwr6em1bFYC7II6pJuwFe0/8MQbM/jR3zWq/dZXGd8crC/bW45/xePzX94nTp0+3cpcjhmV7e3v6/yomiGExBwcHWZ/6l24IWuMOrDIISTcEPaduzOPHj090NUIGFe35GOo6MA8iblQWWJgauT0bVCFQNHBpnnFiaNUsEBYYAHuswZ4H4TITvezJXgoa7iSlG4KBUNfDXmVLgREyDyJkJXBQWaBnfM8JyWOeLVJ2KT5QWaAHNGnKVBm+eRBmoR11Pbj6QVhg4MyzPZgYRTcEAGEBAIQFAMICAGEBgLAAQFgA6JnMeRY8Ng5AUFj8+fMnfQMAuiEACAsAhAUAwgIAYQGg0/4TYADG2twUlXNi7gAAAABJRU5ErkJggg==";
    Images.image_placeholder = "data:image/png;base64," + image;
})();


var Styles = {
    fillDefault: function(obj) {
        if(obj.fill === undefined) obj.fill = new RGBColor("#000");
        if(obj.stroke === undefined) obj.stroke = new RGBColor("#000");
        if(obj.stroke_width === undefined) obj.stroke_width = 1;
        // if(obj.stroke_opacity === undefined) obj.stroke_opacity = 1;
        // if(obj.fill_opacity === undefined) obj.fill_opacity = 1;
        // if(obj.paint_order === undefined) obj.paint_order = "fill";
        // if(obj.blending_mode === undefined) obj.blending_mode = "normal";
        if(obj.font_family === undefined) obj.font_family = "Helvetica";
        if(obj.font_size === undefined) obj.font_size = 16;
        return obj;
    },
    applyStyle: function(style, selection) {
        selection.style({
            "fill": style.fill !== null ? style.fill : "none",
            "stroke": style.stroke !== null ? style.stroke : "none",
            "stroke-width": style.stroke_width
        });
    },
    prepareHighlightColor: function(color, original) {
        if(color === null) return "none";
        if(color instanceof RGBColor) return color;
        if(color.mode == "brighter") {
            // return chroma.mix(new RGBColor(original).toString(), "#FFF", color.value, 'lab');
            return new RGBColor(255, 255, 255, color.value).over(new RGBColor(original));
        } else if(color.mode == "darker") {
            // return chroma.mix(new RGBColor(original).toString(), "#000", color.value, 'lab');
            return new RGBColor(0, 0, 0, color.value).over(new RGBColor(original));
        } else if(color.mode == "brighter-darker") {
            if(color.value > 0) {
                return new RGBColor(255, 255, 255, color.value).over(new RGBColor(original));
            } else {
                return new RGBColor(0, 0, 0, -color.value).over(new RGBColor(original));
            }
        }
        return "none";
    },
    createDefault: function(type) {
        if(type == "range") {
            return {
                fill: new RGBColor("#EEE", 1),
                stroke: null,
                stroke_width: 1
            };
        }
        if(type == "range-line") {
            return {
                fill: null,
                stroke: new RGBColor("#000"),
                fill_opacity: 1,
                stroke_width: 1
            };
        }
        if(type == "label") {
            return {
                fill: new RGBColor("#000"),
                stroke: null,
                stroke_width: 2,
                font_family: "Helvetica",
                font_size: 20
            };
        }
        if(type == "item-label") {
            return {
                fill: new RGBColor("#000"),
                stroke: new RGBColor("#FFF"),
                stroke_width: 2,
                paint_order: "stroke",
                font_family: "Helvetica",
                font_size: 14
            };
        }
        if(type == "highlight") {
            return {
                fill: { mode: "brighter-darker", value: 0.2 },
                stroke: { mode: "brighter-darker", value: -1 },
                stroke_width: 2,
                line_stroke: { mode: "brighter-darker", value: -0.2 },
                line_stroke_width: 3
            };
        }
        if(type == "highlight-all") {
            return {
                fill: { mode: "brighter-darker", value: 0 },
                stroke: null,
                stroke_width: 2,
                line_stroke: { mode: "brighter-darker", value: 0 },
                line_stroke_width: 2
            };
        }
        if(type == "trendline") {
            return {
                fill: null,
                stroke: new RGBColor("#000"),
                stroke_width: 2
            };
        }
        if(type == "bubbleset") {
            return {
                fill: new RGBColor("#888"),
                stroke: null,
                stroke_width: 2
            };
        }
        if(type == "black") {
            return {
                fill: new RGBColor("#000"),
                stroke: new RGBColor("#000"),
                stroke_width: 3
            };
        }
        if(type == "shape.rect" || type == "shape.oval") {
            return {
                fill: new RGBColor("#000", 0.1),
                stroke: new RGBColor("#000"),
                stroke_width: 2
            };
        }
        if(type == "shape.line") {
            return {
                fill: null,
                stroke: new RGBColor("#000"),
                stroke_width: 2,
                arrow: "end"
            };
        }
    }
};

// Presence(target, [
//     [items, "div.classname", {
//         style: {
//         },
//         attr: {
//         },
//         events: {
//         },
//         children: [
//             ["li.span", { text: "Hello" }]
//         ]
//     }]
// ])

function Presence(target, list, dont_render) {
    this.target = target;
    this.list = list;
    if(!dont_render) {
        this.render();
    }
};

Presence.prototype.render = function() {
    var target = this.target;
    var list = this.list;

    for(var i = 0; i < list.length; i++) {
        var item = list[i];
        target.each(function(d_previous) {
            var target_item = d3.select(this);
            if(item instanceof Function) {
                item = item.apply(null, d_previous);
                target_item.selectAll("*").remove();
            }
            if(typeof(item[0]) == "string") {
                var array = null;
                var selector = item[0];
                var config = item[1];
            } else {
                var array = item[0];
                var selector = item[1];
                var config = item[2];
            }
            var sp = selector.split(".");
            var tagname = sp[0];
            var classname = sp[1];
            var data = [ [] ];
            if(!array) {
                if(d_previous) data = [ d_previous ];
            } else {
                if(d_previous) data = array.map(function(d) { return [d].concat(d_previous); });
                else data = array.map(function(d) { return [d]; });
            }
            var selection = target_item.selectAll(selector).data(data);
            selection.exit().remove();
            var selection_enter = selection.enter().append(tagname);
            if(classname) selection_enter.classed(classname, true);
            if(config) {
                if(config.style) {
                    for(var name in config.style) {
                        var value = config.style[name];
                        if(value instanceof Function) {
                            selection.style(name, function(d) {
                                return value.apply(this, d);
                            });
                        } else {
                            selection.style(name, value);
                        }
                    }
                }
                if(config.classed) {
                    for(var name in config.classed) {
                        var value = config.classed[name];
                        if(value instanceof Function) {
                            selection.classed(name, function(d) {
                                return value.apply(this, d);
                            });
                        } else {
                            selection.classed(name, value);
                        }
                    }
                }
                if(config.attr) {
                    for(var name in config.attr) {
                        var value = config.attr[name];
                        if(value instanceof Function) {
                            selection.attr(name, function(d) {
                                return value.apply(this, d);
                            });
                        } else {
                            selection.attr(name, value);
                        }
                    }
                }
                if(config.text) {
                    var value = config.text;
                    if(value instanceof Function) {
                        selection.text(function(d) {
                            return value.apply(this, d);
                        });
                    } else {
                        selection.text(value);
                    }
                }
                if(config.on) {
                    for(var name in config.on) {
                        var value = config.on[name];
                        if(value instanceof Function) {
                            selection.on(name, function(d) {
                                value.apply(this, d);
                            });
                        } else {
                            selection.on(name, value);
                        }
                    }
                }
                if(config.children) {
                    new Presence(selection, config.children);
                }
            }
        });
    }
};

Module.Presence = Presence;


function isArray(o) { return o instanceof Array; }
function isObject(o) { return o instanceof Object; }
function isNone(o) { return o === null || o === undefined; }
function isNumber(o) { return typeof(o) == "number"; }
function isString(o) { return typeof(o) == "string"; }

function deepEquals(a, b) {
    if(a === b) return true;

    if(isArray(a) && isArray(b)) {
        if(a.length != b.length) return false;
        return a.every(function(a, i) {
            return deepEquals(a, b[i]);
        });
    }
    if(isObject(a) && isObject(b)) {
        for(var key in a) {
            if(a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
                if(!deepEquals(a[key], b[key])) return false;
            }
        }
        for(var key in b) {
            if(!a.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
    return a === b;
}

function generateGUID() {
    var S4 = function() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

var object_unique_ids = new WeakMap();
var obj_unique_id_index = 0;
function getObjectUniqueID(obj) {
    if(object_unique_ids.has(obj)) return object_unique_ids.get(obj);
    var id = "_uniqueid_" + obj_unique_id_index;
    obj_unique_id_index += 1;
    object_unique_ids.set(obj, id);
    return id;
}

function resolveToSVGSelection(item) {
    if(item instanceof d3.selection) return item;
    return d3.select(item);
}

function appendOnlyOnce_OLD(g, tag, classname) {
    var selector = tag;
    if(classname !== undefined) selector += "." + classname;
    var sel = g.selectAll(selector).data(function(d) { return [d]; });
    if(classname !== undefined) {
        sel.enter().append(tag).classed(classname, true);
    } else {
        sel.enter().append(tag);
    }
    return sel;
}

// This only append to its children, not internal stuff.
function appendOnlyOnce(g, tag, classname) {
    var selector = tag;
    if(classname !== undefined) selector += "." + classname;
    var sel = g.selectAll(selector).data(function(d) { return [d]; });
    if(classname !== undefined) {
        sel.enter().append(tag).classed(classname, true);
    } else {
        sel.enter().append(tag);
    }
    return sel;
}

function getObjectKeys(obj) {
    var keys = [];
    for(var k in obj) {
        if(obj.hasOwnProperty(k)) keys.push(k);
    }
    return keys;
};

function appendTreeOnce(sel, desc) {
    var result = [];
    var tree_index = 0;
    var tree_prefix = "T-" + getObjectUniqueID(sel.node());
    var make_array = function(parent, array) {
        array.forEach(function(item, i) {
            var name_and_class = item[0];
            var info = { };
            var children = [];
            if(isArray(item[1])) {
                children = item[1];
            } else if(isObject(item[1])) {
                info = item[1];
            }
            if(isArray(item[2])) {
                children = item[2];
            } else if(isObject(item[2])) {
                info = item[2];
            }
            var name = name_and_class.split(".")[0];
            var classname = name_and_class.split(".")[1];
            var s = appendOnlyOnce(parent, name, tree_prefix + tree_index);
            tree_index += 1;
            if(info.$) { result[info.$] = s; }
            if(info.text) { s.text(info.text); }
            if(info.style) { s.style(info.style); }
            if(info.attr) { s.attr(info.attr); }
            if(info.classed) { s.classed(info.classed); }
            if(classname !== undefined) { s.classed(classname, true); }
            if(info.class) { s.classed(info.class, true); }
            make_array(s, children);
        });
    };
    make_array(sel, desc);
    return result;
}

// Always call this in mousedown event handlers.
var setupDragHandlers = function(info) {
    var guid = generateGUID();
    var is_mouse_move = false;
    var x0 = d3.event.pageX;
    var y0 = d3.event.pageY;
    d3.select(window).on("mousemove." + guid, function() {
        d3.event.stopPropagation();
        var x1 = d3.event.pageX;
        var y1 = d3.event.pageY;
        if(is_mouse_move || (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) >= 16) {
            is_mouse_move = true;
            if(info.mousemove) info.mousemove();
        }
    }, true);
    d3.select(window).on("mouseup." + guid, function() {
        d3.select(window).on("mousemove." + guid, null, true);
        d3.select(window).on("mouseup." + guid, null, true);
        if(info.mouseup) info.mouseup();
    }, true);

};

var setupExpressionEditor = function(info) {
    var anchor = info.anchor.getBoundingClientRect();
    if(info.anchor.tagName == "text") {
        var text_anchor = info.anchor.style.textAnchor;
    }
    var body_rect = document.body.parentNode.getBoundingClientRect();
    var font_size = parseFloat(info.anchor.style.fontSize.replace("px", ""));
    var font_family = info.anchor.style.fontFamily;
    var height = font_size + 4;
    var wrapper_width = Math.max(anchor.width, 200);
    var left_offset = 0;
    if(text_anchor == "middle") left_offset = -wrapper_width / 2 + anchor.width / 2;
    if(text_anchor == "end") left_offset = -wrapper_width + anchor.width;
    var wrapper = d3.select("body").append("div").style({
        "position": "absolute",
        "z-index": 1000001,
        "width": wrapper_width + "px",
        "font-family": font_family,
        "font-size": font_size + "px",
        "height": height + "px",
        "line-height": height + "px",
        "left": (anchor.left - body_rect.left + left_offset) + "px",
        "top": (anchor.top - body_rect.top) + "px",
        "padding": "0",
        "margin": "0",
        "background": "white",
        "outline": "1px dashed #AAA",
        "box-shadow": "0 0 2px #AAA",
        "text-align": text_anchor == "middle" ? "center" : (text_anchor == "end" ? "right" : "left")
    });
    wrapper.classed("chartaccent-edit-widget", true);
    var input = wrapper.append("input").style({
        "margin": 0,
        "padding": 0,
        "height": height + "px",
        "line-height": height + "px",
        "outline": "none",
        "border": "none",
        "width": "100%",
        "font-size": font_size + "px",
        "text-align": text_anchor == "middle" ? "center" : (text_anchor == "end" ? "right" : "left")
    }).property("value", Expression.toStringExpression(info.expression));

    var text_measure = document.createElement("canvas");
    var text_measure_ctx = text_measure.getContext("2d");
    text_measure_ctx.font = font_size + "px " + font_family;

    var update_size = function() {
        var wrapper_width = Math.max(anchor.width, text_measure_ctx.measureText(input.property("value")).width + 20);
        var left_offset = 0;
        if(text_anchor == "middle") left_offset = -wrapper_width / 2 + anchor.width / 2;
        if(text_anchor == "end") left_offset = -wrapper_width + anchor.width;
        wrapper.style("width", wrapper_width + "px");
        wrapper.style("left", (anchor.left - body_rect.left + left_offset) + "px");
    };
    update_size();

    input.node().focus();
    input.node().select();
    input.on("blur", function() {
        wrapper.remove();
        try {
            var newexpr = Expression.parseStringExpression(input.property("value"));
        } catch(e) {
        }
        if(newexpr && info.change) info.change(newexpr);
    });
    input.on("input", function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseStringExpression(input.property("value"));
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(is_error) {
            input.style("background-color", "#FCC");
        } else {
            input.style("background-color", "#FFF");
        }
        update_size();
    });
    input.on("keydown", function() {
        d3.event.stopPropagation();
    });
    input.on("keyup", function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseStringExpression(input.property("value"));
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(d3.event.keyCode == 13) {
            input.on("blur", null);
            wrapper.remove();
            if(newexpr && info.change) info.change(newexpr);
        }
        if(d3.event.keyCode == 27) {
            input.on("blur", null);
            wrapper.remove();
        }
        update_size();
    });
};

var setupEasyExpressionEditor = function(info) {
    var anchor = info.anchor.getBoundingClientRect();
    if(info.anchor.tagName == "text") {
        var text_anchor = info.anchor.style.textAnchor;
    }
    var body_rect = document.body.parentNode.getBoundingClientRect();
    var font_size = parseFloat(info.anchor.style.fontSize.replace("px", ""));
    var font_family = info.anchor.style.fontFamily;
    var height = font_size + 4;
    var wrapper_width = Math.max(anchor.width, 200);
    var left_offset = 0;
    if(text_anchor == "middle") left_offset = -wrapper_width / 2 + anchor.width / 2;
    if(text_anchor == "end") left_offset = -wrapper_width + anchor.width;
    var wrapper = d3.select("body").append("div").style({
        "position": "absolute",
        "z-index": 1000001,
        "width": wrapper_width + "px",
        "font-family": font_family,
        "font-size": font_size + "px",
        "height": height + "px",
        "line-height": height + "px",
        "left": (anchor.left - body_rect.left + left_offset) + "px",
        "top": (anchor.top - body_rect.top) + "px",
        "padding": "0",
        "margin": "0",
        "background": "white",
        "outline": "1px dashed #AAA",
        "box-shadow": "0 0 2px #AAA",
        "text-align": text_anchor == "middle" ? "center" : (text_anchor == "end" ? "right" : "left")
    });
    var easy_string = Expression.toEasyString(info.expression);
    wrapper.classed("chartaccent-edit-widget", true);
    var input = wrapper.append("input").style({
        "margin": 0,
        "padding": 0,
        "height": height + "px",
        "line-height": height + "px",
        "outline": "none",
        "border": "none",
        "width": "100%",
        "font-size": font_size + "px",
        "text-align": text_anchor == "middle" ? "center" : (text_anchor == "end" ? "right" : "left")
    }).property("value", easy_string.text);

    var text_measure = document.createElement("canvas");
    var text_measure_ctx = text_measure.getContext("2d");
    text_measure_ctx.font = font_size + "px " + font_family;

    var update_size = function() {
        var wrapper_width = Math.max(anchor.width, text_measure_ctx.measureText(input.property("value")).width + 20);
        var left_offset = 0;
        if(text_anchor == "middle") left_offset = -wrapper_width / 2 + anchor.width / 2;
        if(text_anchor == "end") left_offset = -wrapper_width + anchor.width;
        wrapper.style("width", wrapper_width + "px");
        wrapper.style("left", (anchor.left - body_rect.left + left_offset) + "px");
    };
    update_size();

    input.node().focus();
    input.node().select();
    input.on("blur", function() {
        wrapper.remove();
        try {
            var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        } catch(e) {
        }
        if(newexpr && info.change) info.change(newexpr);
    });
    input.on("input", function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(is_error) {
            input.style("background-color", "#FCC");
        } else {
            input.style("background-color", "#FFF");
        }
        update_size();
    });
    input.on("keydown", function() {
        d3.event.stopPropagation();
    });
    input.on("keyup", function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(d3.event.keyCode == 13) {
            input.on("blur", null);
            wrapper.remove();
            if(newexpr && info.change) info.change(newexpr);
        }
        if(d3.event.keyCode == 27) {
            input.on("blur", null);
            wrapper.remove();
        }
        update_size();
    });
};

var setupClickoutHandlers = function(wrapper, onclickout, parent_clickout) {
    if(!onclickout) onclickout = function() { wrapper.remove(); return true; };

    var guid = generateGUID();

    var context = {
        children: new Set(),
        addChild: function(c) {
            this.children.add(c);
        },
        removeChild: function(c) {
            this.children.delete(c);
        },
        is_in_wrapper: function(target) {
            var result = false;
            var item = target;
            while(item) {
                if(item == wrapper.node()) {
                    result = true;
                    break;
                }
                item = item.parentNode;
            }
            if(result) return true;
            context.children.forEach(function(c) {
                if(c.is_in_wrapper(target)) {
                    result = true;
                }
            });
            return result;
        },
        remove: function() {
            if(parent_clickout) parent_clickout.removeChild(this);
            d3.select(window).on("mousedown." + guid, null);
            d3.select(window).on("contextmenu." + guid, null);
            d3.select(window).on("keydown." + guid, null);
            context.children.forEach(function(c) {
                c.doRemove("parent");
            });
        },
        doRemove: function(type) {
            if(onclickout(type)) {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                context.remove();
                return true;
            } else {
                return false;
            }
        }
    };
    if(parent_clickout) {
        parent_clickout.addChild(context);
    }
    d3.select(window).on("mousedown." + guid, function() {
        if(context.is_in_wrapper(d3.event.target)) return;
        if(context.doRemove("clickout")) {
            // console.log("Added click handler");
            d3.select(window).on("click." + guid, function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                d3.select(window).on("click." + guid, null);
                // console.log("Removed click handler");
            }, true);
        }
    }, true);
    d3.select(window).on("contextmenu." + guid, function() {
        if(context.is_in_wrapper(d3.event.target)) return;
        context.doRemove("clickout");
    }, true);
    d3.select(window).on("keydown." + guid, function() {
        if(context.is_in_wrapper(d3.event.target)) return;
        if(d3.event.keyCode == 27) {
            context.doRemove("escape");
        }
        if(d3.event.keyCode == 8 || d3.event.keyCode == 46) {
            context.doRemove("delete");
        }
    });
    return context;
};

IconFont = {
    addIcon: function(name) {
        return function() {
            if(typeof(name) == "function") {
                this.append("span").attr("class", function(d) { return "chartaccent-icons-" + name(d); });
            } else {
                this.append("span").attr("class", "chartaccent-icons-" + name);
            }
        };
    },
    addIconOnce: function(name) {
        return function() {
            if(typeof(name) == "function") {
                appendOnlyOnce(this, "span").attr("class", function(d) { return "chartaccent-icons-" + name(d); });
            } else {
                appendOnlyOnce(this, "span").attr("class", "chartaccent-icons-" + name);
            }
        };
    },
    iconDesc: function(name) {
        return ["span.chartaccent-icons-" + name]
    },
    svgIcon: function(name) {
        return function() {
            this.text(FONT_chartaccent_icons["chartaccent-icons-" + name]);
            this.style("font-family", "chartaccent_icons");
        };
    },
    icons: FONT_chartaccent_icons
};

Module.IconFont = IconFont;

var ObjectSerializer = function() {
    this.obj_registry = new WeakMap();
    this.name2obj = new Map();
    this.class_registry = new WeakMap();
    this.name2class = new Map();

    this.registerClass(Object, "js.Object");
};

// Register class.
ObjectSerializer.prototype.registerClass = function(constructor, name) {
    if(name === undefined) name = getObjectUniqueID(constructor);
    this.class_registry.set(constructor, name);
    this.name2class.set(name, constructor);
};

// Register global object.
ObjectSerializer.prototype.registerObject = function(object, name) {
    if(name === undefined) name = getObjectUniqueID(object);
    this.obj_registry.set(object, name);
    this.name2obj.set(name, object);
};

ObjectSerializer.prototype.getClassID = function(constructor) {
    if(!this.class_registry.has(constructor)) {
        this.registerClass(constructor, getObjectUniqueID(constructor));
    }
    return this.class_registry.get(constructor);
};

// Serialize an object.
ObjectSerializer.prototype.serialize = function(input) {
    var store = { };
    var self = this;

    function store_object(oid, obj) {
        if(self.obj_registry.has(obj)) {
            return { r: self.obj_registry.get(obj) };
        }
        if(store[oid]) return;
        var store_item = { t: self.getClassID(obj.constructor), p: { } };
        store[oid] = store_item;
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                store_item.p[key] = do_serialize(obj[key]);
            }
        }
        return oid;
    }

    function do_serialize(obj) {
        if(typeof(obj) == "object" || typeof(obj) == "function") {
            if(obj === null) return null;
            if(obj === undefined) return undefined;
            if(obj instanceof Array) {
                return obj.map(do_serialize);
            } else {
                var oid = getObjectUniqueID(obj);
                return { id: store_object(oid, obj) };
            }
        } else {
            // Primitive type.
            return obj;
        }
    }

    return {
        root: do_serialize(input),
        store: store
    };
};



var Widgets = { };

Widgets.CircularButton = function(info) {
    return function() {
        this.classed("button", true);
        var circle = appendOnlyOnce(this, "circle");
        var text = appendOnlyOnce(this, "text");
        circle.attr("cx", info.x);
        circle.attr("cy", info.y);
        circle.attr("r", info.r);
        text.attr("x", info.x);
        text.attr("y", info.y);
        text.style({
            "alignment-baseline": "central",
            "text-anchor": "middle"
        });
        text.each(function(d) {
            d3.select(this).call(IconFont.svgIcon(info.icon(d)));
        });
        circle.filter(function(d) { return !info.hasBorder(d); }).remove();
    };
};

Widgets.RangeTab = function(info) {
    var width = 15;

    return function() {
        this.classed("chartaccent-range-tab", true);
        var path = appendOnlyOnce(this, "path");
        var btn = this.selectAll("g.button").data(function(d) {
            return info.buttons.map(function(button, i) {
                return [d, button, i];
            });
        });
        btn.enter().append("g").attr("class", "button");
        btn.exit().remove();
        var buttons_t = function(d) {
            var tabwidth = Math.abs(info.t2(d[0]) - info.t1(d[0]));
            if(tabwidth < 22 * info.buttons.length) {
                return (info.t2(d[0]) + info.t1(d[0])) / 2.0;
            } else {
                var shift = d[2] * 22 - (info.buttons.length - 1) * 22 / 2;
                return (info.t2(d[0]) + info.t1(d[0])) / 2.0 + shift;
            }
        };
        var buttons_s = function(d) {
            var tabwidth = Math.abs(info.t2(d[0]) - info.t1(d[0]));
            if(tabwidth < 22) {
                return width + d[2] * 22 + 11;
            } else if(tabwidth < 22 * info.buttons.length) {
                return width + d[2] * 22;
            } else {
                return width / 2;
            }
        };
        var buttons_b = function(d) {
            var tabwidth = Math.abs(info.t2(d[0]) - info.t1(d[0]));
            if(tabwidth < 22) {
                return true;
            }
            return false;
        };
        if(info.orientation == "vertical") {
            path.attr("d", function(d) {
                if(info.t1(d) == info.t2(d)) {
                    return Geometry.Path.tabV(info.t1(d) - 1, info.t2(d) + 1, width + 5, 1);
                } else {
                    return Geometry.Path.tabV(info.t1(d), info.t2(d), width, width);
                }
            });
            btn.call(Widgets.CircularButton({
                x: buttons_s, y: buttons_t,
                r: 8,
                icon: function(d) { return d[1]; },
                hasBorder: buttons_b
            }));
        } else {
            path.attr("d", function(d) {
                if(info.t1(d) == info.t2(d)) {
                    return Geometry.Path.tabH(info.t1(d) - 1, info.t2(d) + 1, -width - 5, 1);
                } else {
                    return Geometry.Path.tabH(info.t1(d), info.t2(d), -width, width);
                }
            });
            btn.call(Widgets.CircularButton({
                x: buttons_t,
                y: function(d) { return -buttons_s(d); },
                r: 8,
                icon: function(d) { return d[1]; },
                hasBorder: buttons_b
            }));
        }
        if(info.buttonActive) {
            btn.classed("active", function(d) {
                return info.buttonActive(d[0], d[1]);
            });
        }
        path.style("cursor", "pointer");
        path.on("click", function(d) {
            info.onClick(d, "more", this);
        });
        btn.on("click", function(d) {
            info.onClick(d[0], d[1], this);
        });
    };
};

var ExpressionSuggestion = function() {
    this.tree = appendTreeOnce(d3.select("body"), [
        [ "chartaccent-suggestions.chartaccent-edit-widget", { $: "container" }, [
            [ "div.item-list", { $: "items" } ]
        ]]
    ]);
    this.tree.container.on("mousedown", function() {
        d3.event.preventDefault();
    });
    this.shown = false;
};

ExpressionSuggestion.prototype.getSuggestionList = function(context) {
    var suggestions = [];
    var data = context.get("data");
    if(data) {
        for(var key in data[0]) {
            var value = data[0][key];
            if(isNumber(value)) {
                suggestions.push("avg@(" + key + ")");
                suggestions.push("median@(" + key + ")");
                suggestions.push("min@(" + key + ")");
                suggestions.push("max@(" + key + ")");
            }
        }
    }
    return suggestions;
};

ExpressionSuggestion.prototype.trigger = function(input, position, context) {
    return;
    var self = this;
    if(this.current_timeout) {
        clearTimeout(this.current_timeout);
    }
    this.current_timeout = setTimeout(function() {
        if(!self.shown) {
            self.show(input, position, context);
        }
    }, 200);
};
ExpressionSuggestion.prototype.show = function(input, position, context) {
    var self = this;
    this.shown = true;
    this.tree.container.style("display", "block");
    var input_rect = input.node().getBoundingClientRect();
    var body_rect = document.body.getBoundingClientRect();
    this.tree.container.style("left", (input_rect.left - body_rect.left) + "px");
    this.tree.container.style("top", (input_rect.top - body_rect.top + input_rect.height) + "px");

    var data = context.get("data");
    if(data) {
        var suggestions = [];
        // console.log(data[0]);
        for(var key in data[0]) {
            var value = data[0][key];
            if(isNumber(value)) {
                suggestions.push("mean@(" + key + ")");
                suggestions.push("median@(" + key + ")");
                suggestions.push("min@(" + key + ")");
                suggestions.push("max@(" + key + ")");
            }
        }
        // console.log(suggestions);
        // suggestions.sort(function(a, b) { return a < b ? -1 : 1; });
        var div_items = this.tree.items.selectAll("div").data(suggestions);
        div_items.enter().append("div");
        div_items.exit().remove();
        div_items.text(function(d) { return d; });
        div_items.on("click", function(d) {
            Events.raise(self, "apply", d);
        });
    } else {
        this.hide();
    }
};
ExpressionSuggestion.prototype.hide = function() {
    this.shown = false;
    this.tree.container.style("display", "none");
    if(this.current_timeout) {
        clearTimeout(this.current_timeout);
        this.current_timeout = null;
    }
};
ExpressionSuggestion.prototype.remove = function(input, position, context) {
};
var SubstringMatcher = function(strs) {
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    };
    var expr_filter = function(m) {
        return m.replace(/[^0-9a-zA-Z]+/g, " ").split(" ").filter(function(x) { return x != ""; }).map(function(x) { return x.toLowerCase(); });
    };
    return function findMatches(q, cb) {
        q = expr_filter(q);
        var matches, substringRegex;
        matches = [];
        $.each(strs, function(i, str) {
            var str_split = expr_filter(str);
            // if for each component of q, there is one match, then pass.
            var pass = q.every(function(component) {
                return str_split.some(function(s) {
                    // component is a prefix of s.
                    return s.substr(0, component.length) == component;
                });
            });
            if(pass) {
                matches.push(str);
            }
        });
        cb(matches);
    };
};

function insertAtCaret(node, to_add) {
    var sel_start = node.selectionStart;
    var sel_end = node.selectionEnd;
    var new_text = node.value.substr(0, sel_start) + to_add + node.value.substr(sel_end);
    node.value = new_text;
    node.setSelectionRange(sel_start, sel_start + to_add.length);
}

var MakeExpressionInput = function(sel, expression, onchange, context) {
    sel.selectAll("*").remove();
    var input = sel.append("input");
    input.classed("input-expression", true);
    input.property("value", expression.toString());
    var suggestion = new ExpressionSuggestion();

    $(input.node()).typeahead({
        hint: true,
        highlight: true,
        minLength: 0
    }, {
        name: 'Hints',
        limit: 1000,
        source: SubstringMatcher(suggestion.getSuggestionList(context))
    });

    var update_error_status = function() {
        var is_error = false;
        try {
            var newexpr = Expression.parse(input.property("value"));
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(is_error) {
            input.style("background-color", "#FCC");
        } else {
            input.style("background-color", "#FFF");
        }
        return newexpr;
    };
    $(input.node()).on("typeahead:selected", function() {
        var expr = update_error_status();
        if(expr && onchange) {
            onchange(expr);
        }
    });
    $(input.node()).on("focus", function() {
        input.node().select();
    });
    $(input.node()).on("input", function() {
        var expr = update_error_status();
    });
    $(input.node()).change(function() {
        var expr = update_error_status();
        if(expr && onchange) {
            onchange(expr);
        }
    });
    $(input.node()).blur(function() {
        var expr = update_error_status();
        if(!expr) {
            input.property("value", expression.toString());
        }
    });
};

var MakeStringExpressionInput = function(sel, expression, onchange, context) {
    sel.classed("input-expression", true);
    sel.property("value", Expression.toStringExpression(expression));
    var update_error_status = function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseStringExpression(sel.property("value"));
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(is_error) {
            sel.style("background-color", "#FCC");
        } else {
            sel.style("background-color", "#FFF");
        }
        return newexpr;
    };
    sel.on("input", update_error_status);
    sel.on("change", function() {
        var newexpr = update_error_status();
        if(newexpr && onchange) {
            onchange(newexpr);
        }
    });
};

var MakeEasyStringExpressionInput = function(sel, expression, onchange, context) {
    var easy_string = Expression.toEasyString(expression);
    var format = easy_string.format;

    var tree = appendTreeOnce(sel, [
        [ "input", { $: "input", style: { width: "234px" } } ],
        [ "span", { $: "more_less" }, [
            [ "span", { text: " " } ],
            [ "span.btn", { $: "btn_more" }, [ IconFont.iconDesc("digits-more") ] ],
            [ "span", { text: " " } ],
            [ "span.btn", { $: "btn_less" }, [ IconFont.iconDesc("digits-less") ] ]
        ]],
    ]);
    var input = tree.input;

    if(!format || !(Expression.isSimpleFunction(format, "format") || Expression.isSimpleFunction(format, "formatRange"))) {
        tree.more_less.remove();
    } else {
        var format_fmt = format.args[0].value;
        var m = format_fmt.match(/^\.([\d]+)f$/);
        if(!m) {
            tree.more_less.remove();
        } else {
            var fmt = parseInt(m[1]);
            tree.btn_more.on("click", function() {
                if(fmt + 1 < 6) {
                    format.args[0].value = "." + (fmt + 1) + "f";
                    onchange(expression);
                }
            });
            tree.btn_less.on("click", function() {
                if(fmt - 1 >= 0) {
                    format.args[0].value = "." + (fmt - 1) + "f";
                    onchange(expression);
                }
            });
        }
    }

    var sel_start = input.node().selectionStart, sel_end = input.node().selectionEnd;
    input.property("value", easy_string.text);
    input.node().setSelectionRange(sel_start, sel_end);

    sel.on("input", function() { // instant update.
        var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        if(newexpr && onchange) {
            onchange(newexpr);
        }
    });
    sel.on("change", function() {
        var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        if(newexpr && onchange) {
            onchange(newexpr);
        }
    });
};

var MakeTextInput = function(sel, text, onchange) {
    sel.property("value", !isNone(text) ? text : "");
    sel.on("change", function() {
        var newexpr = sel.property("value");
        if(newexpr && onchange) {
            onchange(newexpr);
        }
    });
    sel.on("focus", function() {
        sel.node().select();
    });
};

var MakeNumberInput = function(sel, text, onchange) {
    sel.style("width", "30px").style("text-align", "right");
    MakeTextInput(sel, text.toString(), function(d) {
        var number = parseFloat(d);
        onchange(number);
    });
};

var MakeCheckbox = function(sel, text, value, onchange) {
    sel.classed("btn-checkbox", true);
    var icon = appendOnlyOnce(sel, "span", "icon");
    var sp = appendOnlyOnce(sel, "span", "space").text(" ");
    var name = appendOnlyOnce(sel, "span", "name").text(text);
    var current_value = value;
    var update = function() {
        icon.selectAll("*").remove();
        if(current_value) {
            icon.call(IconFont.addIconOnce("checkbox-correct-checked"));
        } else {
            icon.call(IconFont.addIconOnce("checkbox-correct-empty"));
        }
        sel.classed("active", current_value);
    }
    sel.on("click", function() {
        current_value = !current_value;
        update();
        onchange(current_value);
    });
    update();
};

var MakeNumberInputUpDown = function(sel, number, tick, range, onchange) {
    sel.classed("input-updown", true);
    var input = appendOnlyOnce(sel, "input").style("width", "30px").style("text-align", "right");
    var btns = appendOnlyOnce(sel, "span");
    var btn_up = appendOnlyOnce(btns, "span", "btn-up").classed("btn-up", true);
    btn_up.call(IconFont.addIconOnce("arrow-up"));
    var btn_down = appendOnlyOnce(btns, "span", "btn-down").classed("btn-down", true);
    btn_down.call(IconFont.addIconOnce("arrow-down"));

    var current_number = number;

    btn_up.on("click", function() {
        current_number += tick;
        if(current_number > range[1]) current_number = range[1];
        if(current_number < range[0]) current_number = range[0];
        onchange(current_number);
        refresh();
    });
    btn_down.on("click", function() {
        current_number -= tick;
        if(current_number > range[1]) current_number = range[1];
        if(current_number < range[0]) current_number = range[0];
        onchange(current_number);
        refresh();
    });
    var refresh = function() {
        MakeTextInput(input, current_number.toString(), function(d) {
            if(parseFloat(d) == parseFloat(d)) {
                current_number = parseFloat(d);
                if(current_number > range[1]) current_number = range[1];
                if(current_number < range[0]) current_number = range[0];
                onchange(current_number);
            }
        });
    };
    refresh();
};


var MakeNumberInputFontSize = function(sel, number, tick, range, onchange, clickout_handlers) {
    sel.classed("input-fontsize", true);
    var tree = appendTreeOnce(sel, [
        [ "input", { style: { width: "30px", "text-align": "right" }, $: "input" } ],
        [ "span.dropdown", { $: "btn_dropdown" }, [ IconFont.iconDesc("arrow-down") ] ],
        [ "span.btn", { $: "btn_up" }, [ IconFont.iconDesc("font-larger") ] ],
        [ "span.btn", { $: "btn_down" }, [ IconFont.iconDesc("font-smaller") ] ]
    ]);

    var current_number = number;

    tree.btn_up.on("click", function() {
        current_number += tick;
        if(current_number > range[1]) current_number = range[1];
        if(current_number < range[0]) current_number = range[0];
        onchange(current_number);
        refresh();
    });
    tree.btn_down.on("click", function() {
        current_number -= tick;
        if(current_number > range[1]) current_number = range[1];
        if(current_number < range[0]) current_number = range[0];
        onchange(current_number);
        refresh();
    });
    tree.btn_dropdown.on("click", function() {
        var font_sizes = [ 8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96 ];
        var items = font_sizes.map(function(d) { return { name: d.toString(), value: d }; });
        var select = CreateEditorPopup("Select", {
            anchor: sel.node(),
            parent_clickout_handlers: clickout_handlers,
            value: current_number,
            choices: items
        });
        Events.on(select, "value", function(value) {
            current_number = value;
            onchange(current_number);
            refresh();
        });
    });
    var refresh = function() {
        MakeTextInput(tree.input, current_number.toString(), function(d) {
            if(parseFloat(d) == parseFloat(d)) {
                current_number = parseFloat(d);
                if(current_number > range[1]) current_number = range[1];
                if(current_number < range[0]) current_number = range[0];
                onchange(current_number);
            }
        });
    };
    refresh();
};

var MakeNumberSlider = function(sel, value, range, onchange, slider_width) {
    var width = slider_width !== undefined ? slider_width : 80;
    var tree = appendTreeOnce(sel, [
        [ "svg", { $: "svg", attr: { width: width, height: 28 }, style: { "vertical-align": "top" } }, [
            [ "line", {
                attr: {
                    x1: 8, x2: width - 8, y1: 14, y2: 14
                },
                style: {
                    "stroke": "#888",
                    "stroke-width": "2",
                    "stroke-linecap": "round"
                }
            }],
            [ "circle", {
                $: "handle",
                attr: {
                    cx: 0, cy: 14, r: 5
                },
                style: {
                    "fill": "#444",
                    "stroke": "none",
                    "cursor": "move"
                }
            }]
        ]]
    ]);

    var scale = d3.scale.linear().domain(range).range([8, width - 8]);

    var current_value = value;

    tree.handle
        .on("mousedown", function() {
            var x0 = d3.event.pageX;
            var v0 = current_value;
            setupDragHandlers({
                mousemove: function() {
                    var x1 = d3.event.pageX;
                    var newvalue = scale.invert(scale(v0) + x1 - x0);
                    if(newvalue > range[1]) newvalue = range[1];
                    if(newvalue < range[0]) newvalue = range[0];
                    onchange(newvalue);
                    current_value = newvalue;
                    update_handle();
                }
            });
        });

    var update_handle = function() {
        tree.handle.attr("cx", scale(current_value));
    };

    update_handle();
};

var MakeColorPicker = function(sel, color, onchange, clickout_handlers) {
    sel.classed("color", true);
    var content = appendOnlyOnce(sel, "span", "content");
    var span_cross = appendOnlyOnce(sel, "svg", "cross-small");
    span_cross
        .attr("width", 20).attr("height", 20);
    appendOnlyOnce(span_cross, "line").attr({
            x1: 0, y1: 0, x2: 20, y2: 20
        }).style({
            "stroke-width": 2,
            "stroke": "#d62728"
        });
    if(color !== null) {
        content.style("background", color);
        content.style("display", "inline-block");
        span_cross.style("display", "none");
    } else {
        content.style("background", "none");
        content.style("display", "none");
        span_cross.style("display", "inline-block");
    }
    sel.on("click", function() {
        var element = this;
        var colorpicker = CreateEditorPopup("ColorPicker", {
            anchor: this,
            parent_clickout_handlers: clickout_handlers,
            color: color
        });
        Events.on(colorpicker, "color", function(color) {
            if(color !== null) {
                content.style("background", color);
                span_cross.style("display", "none");
            } else {
                content.style("background", "none");
                span_cross.style("display", "inline-block");
            }
            onchange(color);
        });
    });
};

var MakeStrokeColorPicker = function(sel, color, onchange, clickout_handlers) {
    sel.classed("color", true);
    var content = appendOnlyOnce(sel, "span", "content");
    var occluder = appendOnlyOnce(sel, "span", "occluder");
    var span_cross = appendOnlyOnce(sel, "svg", "cross-small");
    span_cross
        .attr("width", 20).attr("height", 20);
    appendOnlyOnce(span_cross, "line").attr({
            x1: 0, y1: 0, x2: 20, y2: 20
        }).style({
            "stroke-width": 2,
            "stroke": "#d62728"
        });
    if(color !== null) {
        content.style("background", color);
        content.style("display", "inline-block");
        span_cross.style("display", "none");
    } else {
        content.style("background", "none");
        content.style("display", "none");
        span_cross.style("display", "inline-block");
    }
    sel.on("click", function() {
        var element = this;
        var colorpicker = CreateEditorPopup("ColorPicker", {
            anchor: this,
            parent_clickout_handlers: clickout_handlers,
            color: color
        });
        Events.on(colorpicker, "color", function(color) {
            if(color !== null) {
                content.style("background", color);
                span_cross.style("display", "none");
            } else {
                content.style("background", "none");
                span_cross.style("display", "inline-block");
            }
            onchange(color);
        });
    });
};

var MakeSwitchButton = function(sel, value, choices, onchange) {
    sel.classed("btn-group-switch", true);
    var spans = sel.selectAll("span.switch-item").data(choices);
    spans.enter().append("span").classed("switch-item", true);
    spans.exit().remove();
    appendOnlyOnce(spans, "span", "icon").each(function(d) {
        if(d.icon) {
            d3.select(this).call(IconFont.addIconOnce(d.icon));
            appendOnlyOnce(d3.select(this), "span", "space").text(" ");
        } else {
            d3.select(this).selectAll("*").remove();
        }
    });
    appendOnlyOnce(spans, "span", "text").text(function(d) { return d.name; });
    var current_value = value;
    spans.classed("active", function(d) {
        return current_value == d.value;
    });
    spans.on("click", function(d) {
        console.log(d.value, d);
        onchange(d.value);
        current_value = d.value;
        spans.classed("active", function(d) {
            return current_value == d.value;
        });
    });
};

var MakeSelectButton = function(sel, value, choices, onchange, clickout_handlers) {
    var current_value = value;
    var tree = appendTreeOnce(sel, [
        [ "span", { $: "btn", class: "btn btn-toggle" }, [
            [ "span", { $: "text", text: choices.filter(function(d) { return d.value == current_value })[0].name } ],
            [ "span", { text: " " } ],
            [ "span", { $: "icon" } ]
        ]]
    ]);
    tree["icon"].call(IconFont.addIconOnce("arrow-down"));
    tree["btn"].on("click", function() {
        var select = CreateEditorPopup("Select", {
            anchor: this,
            parent_clickout_handlers: clickout_handlers,
            value: current_value,
            choices: choices
        });
        tree["btn"].classed("active", true);
        Events.on(select, "value", function(value) {
            current_value = value;
            onchange(value);
            tree["text"].text(choices.filter(function(d) { return d.value == current_value })[0].name);
            tree["btn"].classed("active", false);
        });
        Events.on(select, "remove", function(value) {
            tree["btn"].classed("active", false);
        });
    });
};

var MakeSingleSelectButton = function(sel, text, choices, onchange, clickout_handlers) {
    var tree = appendTreeOnce(sel, [
        [ "span", { $: "btn", class: "btn btn-toggle" }, [
            [ "span", { $: "text", text: text } ],
            [ "span", { text: " " } ],
            [ "span", { $: "icon" } ]
        ]]
    ]);
    tree["icon"].call(IconFont.addIconOnce("arrow-down"));
    tree["btn"].on("click", function() {
        var select = CreateEditorPopup("Select", {
            anchor: this,
            parent_clickout_handlers: clickout_handlers,
            choices: choices
        });
        tree["btn"].classed("active", true);
        Events.on(select, "value", function(value) {
            onchange(value);
            tree["btn"].classed("active", false);
        });
        Events.on(select, "remove", function(value) {
            tree["btn"].classed("active", false);
        });
    });
};

var MakeFontSelectButton = function(sel, value, onchange, clickout_handlers) {
    var fonts = [
        { name: "Helvetica", value: "Helvetica", font: "Helvetica" },
        { name: "Arial", value: "Arial", font: "Arial" },
        { name: "Lucida Grande", value: "Lucida Grande", font: "Lucida Grande" },
        { name: "Geneva", value: "Geneva", font: "Geneva" },
        { name: "Verdana", value: "Verdana", font: "Verdana" },
        { name: "Tahoma", value: "Tahoma", font: "Tahoma" },
        { name: "Comic Sans MS", value: "Comic Sans MS", font: "Comic Sans MS" },
        { name: "Impact", value: "Impact", font: "Impact" },
        { name: "Georgia", value: "Georgia", font: "Georgia" },
        { name: "Times", value: "Times", font: "Times" },
        { name: "Palatino", value: "Palatino", font: "Palatino" },
        { name: "Consolas", value: "Consolas", font: "Consolas" },
        { name: "Lucida Console", value: "Lucida Console", font: "Lucida Console" }
    ];
    MakeSelectButton(sel, value, fonts, onchange, clickout_handlers);
};

var MakeLabelAnchorSelectButton = function(sel, value, onchange, clickout_handlers) {
    var anchor_to_text = function(anchor) {
        var v = anchor.split(",");
        var cvt = {
            "t": "Top", "tt": "Top-Outside",
            "b": "Bottom", "bb": "Bottom-Outside",
            "l": "Left", "ll": "Left-Outside",
            "r": "Right", "rr": "Right-Outside",
            "m": "Middle"
        };
        return cvt[v[0]] + ", " + cvt[v[1]];
    };

    var current_value = value;
    var tree = appendTreeOnce(sel, [
        [ "span", { $: "btn", class: "btn btn-toggle" }, [
            [ "span", { $: "text", text: anchor_to_text(current_value) } ],
            [ "span", { text: " " } ],
            [ "span", { $: "icon" } ]
        ]]
    ]);
    tree["icon"].call(IconFont.addIconOnce("arrow-down"));

    tree["btn"].on("click", function() {
        var select = CreateEditorPopup("LabelAnchorSelect", {
            anchor: this,
            parent_clickout_handlers: clickout_handlers,
            value: current_value
        });
        tree["btn"].classed("active", true);
        Events.on(select, "value", function(value) {
            current_value = value;
            onchange(value);
            tree["text"].text(anchor_to_text(current_value));
            tree["btn"].classed("active", false);
        });
        Events.on(select, "remove", function(value) {
            tree["btn"].classed("active", false);
        });
    });
};

function MakeCheckboxList(ul, info) {
    ul.classed("checkboxes", true);
    var li = ul.selectAll("li").data(info.items);
    var li_enter = li.enter().append("li").classed("btn-toggle", true);
    li_enter.append("span").classed("checkbox", true).append("span");
    li_enter.append("span").classed("name", true);
    li.select(".name").text(function(d) { return " " + info.name(d); });
    var update_checked = function() {
        li.select("span.checkbox").select("span").attr("class", function(d) {
            return info.isChecked(d) ? "chartaccent-icons-checkbox-correct-checked" : "chartaccent-icons-checkbox-correct-empty";
        });
        li.classed("active", function(d) { return info.isChecked(d); });
    };
    li.on("click", function(d) {
        if(info.onToggle(d)) {
        } else {
        }
        update_checked();
    });
    update_checked();
};

var MakeColorfulSlider = function(sel, value, range, colors, onchange) {
    var width = 130;
    var tree = appendTreeOnce(sel, [
        [ "svg", { $: "svg", attr: { width: width, height: 28 }, style: { "vertical-align": "top" } }, [
            ["defs", { $: "gradients" } ],
            [ "g", { $: "lines", style: { cursor: "default" } } ],
            [ "g", {
                $: "handle",
            }, [
                [ "path", {
                    attr: {
                        "d": "M-3,-10L-3,10L3,10L3,-10Z"
                    },
                    style: {
                        "fill": "none",
                        "stroke": "#ccc",
                        "stroke-width": 3,
                        "pointer-events": "all",
                        "cursor": "move",
                        "shape-rendering": "crispEdges"
                    }
                } ],
                [ "path", {
                    attr: {
                        "d": "M-3,-10L-3,10L3,10L3,-10Z"
                    },
                    style: {
                        "fill": "none",
                        "stroke": "#444",
                        "pointer-events": "all",
                        "cursor": "move",
                        "shape-rendering": "crispEdges"
                    }
                } ]
            ]]
        ]]
    ]);

    var scale = d3.scale.linear().domain(range).range([8, width - 8]);

    var line_width = Math.floor(15 / colors.length);
    var yoffset = function(d, i) {
        return 14 + (i - (colors.length - 1) / 2) * line_width - line_width / 2;
    };
    var gradient_id = function(d) {
        return getObjectUniqueID(sel.node()) + "-gradient-stop-" + d.toString().replace(/[^0-9a-zA-Z]/g, "");
    };

    var sel_gradients = tree.gradients.selectAll("linearGradient").data(colors);
    sel_gradients.enter().append("linearGradient");
    sel_gradients.exit().remove();
    sel_gradients.attr({
        "id": gradient_id,
        "x1": "0%", "y1": "50%", "x2": "100%", "y2": "50%"
    });
    var sel_gradients_stops = sel_gradients.selectAll("stop").data(function(d) {
        var colors = [];
        for(var k = 0; k <= 10; k++) {
            var value = -(k / 10 * (range[1] - range[0]) + range[0]);
            colors.push(Styles.prepareHighlightColor({ mode: "brighter-darker", value: value }, d));
        }
        return colors;
    });
    sel_gradients_stops.enter().append("stop");
    sel_gradients_stops.exit().remove();
    sel_gradients_stops.attr({
        "offset": function(d, i) { return i / 10 * 100 + "%"; },
        "stop-color": function(d) { return d; },
        "stop-opacity": 1
    });

    var sel_lines = tree.lines.selectAll("rect").data(colors)
    sel_lines.enter().append("rect");
    sel_lines.exit().remove();
    sel_lines.attr({
        x: 8, width: width - 16,
        y: yoffset, height: line_width
    }).style({
        "fill": function(d) { return "url(#" + gradient_id(d) + ")"; },
        "stroke": "none",
        "shape-rendering": "crispEdges"
    });

    var current_value = value;

    tree.handle
        .on("mousedown", function() {
            var x0 = d3.event.pageX;
            var v0 = current_value;
            setupDragHandlers({
                mousemove: function() {
                    var x1 = d3.event.pageX;
                    var newvalue = scale.invert(scale(v0) + x1 - x0);
                    if(Math.abs(newvalue) < 0.1) newvalue = 0;
                    if(newvalue > range[1]) newvalue = range[1];
                    if(newvalue < range[0]) newvalue = range[0];
                    onchange(newvalue);
                    current_value = newvalue;
                    update_handle();
                }
            });
        });
    // tree.lines
    //     .on("mousedown", function() {
    //         var x0 = d3.event.pageX;
    //         var v0 = current_value;
    //         setupDragHandlers({
    //             mousemove: function() {
    //                 var x1 = d3.event.pageX;
    //                 var newvalue = scale.invert(scale(v0) + x1 - x0);
    //                 if(Math.abs(newvalue) < 0.1) newvalue = 0;
    //                 if(newvalue > range[1]) newvalue = range[1];
    //                 if(newvalue < range[0]) newvalue = range[0];
    //                 onchange(newvalue);
    //                 current_value = newvalue;
    //                 update_handle();
    //             }
    //         });
    //     });

    var update_handle = function() {
        tree.handle.attr("transform", "translate(" + scale(current_value) + ", 14)");
    };

    update_handle();
};



var Expression = (function() {

var Expression = { };

Expression.Globals = { };

Expression.Context = function(properties, parent) {
    this.parent = parent;
    this.properties = properties;
};

Expression.Context.prototype.get = function(name) {
    if(this.properties[name] !== undefined) return this.properties[name];
    if(this.parent !== undefined) {
        var parent_value = this.parent.get(name);
        if(parent_value !== undefined) return parent_value;
    }
    if(Expression.Globals[name]) return Expression.Globals[name];
    return undefined;
};

Expression.Context.prototype.set = function(name, value) {
    this.properties[name] = value;
};


Expression.CreateContext = function(properties, parent) {
    return new Expression.Context(properties, parent);
}

Expression.CreateDataContext = function(dataitem, parent) {
    return new Expression.Context(dataitem, parent);
}

Expression.Subscription = function(data, filter) {
    this.data = data;
    this.filter = filter;
};

Expression.Subscription.prototype.eval = function(context) {
    var data = this.data.eval(context);
    var filter = this.filter;
    var filtered = data.filter(function(d) {
        var dcontext = Expression.CreateDataContext(d, context);
        return filter.eval(dcontext);
    });
    return filtered;
};

Expression.Subscription.prototype.toString = function() {
    return this.data.toString() + "[" + this.filter.toString() + "]";
};

Expression.Functions = { };

Expression.Function = function(funcitem, args, kwargs) {
    this.funcitem = funcitem;
    this.args = args;
    this.kwargs = kwargs;
};

Expression.Function.prototype.eval = function(context) {
    var action = this.funcitem.eval(context);
    var args_eval = new Array(this.args.length);
    for(var i = 0; i < this.args.length; i++) {
        args_eval[i] = this.args[i].eval(context);
    }
    var kwargs_eval = { };
    for(var key in this.kwargs) {
        kwargs_eval[key] = this.kwargs[key].eval(context);
    }
    return action(args_eval, kwargs_eval);
};

Expression.Function.prototype.toString = function() {
    var args = this.args.map(function(arg) { return arg.toString(); }).join(", ");;
    for(var key in this.kwargs) {
        var s = key + " = " + this.kwargs[key].toString();
        if(args == "") args = s;
        else args += ", " + s;
    }
    return this.funcitem.toString() + "(" + args + ")";
};

Expression.Function.prototype.clone = function() {
    var args = this.args.map(function(d) { return d.clone(); });
    var kwargs = { };
    for(var k in this.kwargs) {
        kwargs[k] = this.kwargs[k].clone();
    }
    return new Expression.Function(this.funcitem.clone(), args, kwargs);
};

Expression.FunctionApply = function(funcitem, args, kwargs) {
    this.funcitem = funcitem;
    this.args = args;
    this.kwargs = kwargs;
};

Expression.FunctionApply.prototype.eval = function(context) {
    var variable_expression = this.args[0];
    if(this.args[1]) {
        var data = this.args[1].eval(context);
    } else {
        var data = context.get("data");
    }
    var args = data.map(function(d) {
        var new_context = Expression.CreateDataContext(d, context);
        return variable_expression.eval(new_context);
    });
    var kwargs_eval = { };
    for(var key in this.kwargs) {
        kwargs_eval[key] = this.kwargs[key].eval(context);
    }
    var action = this.funcitem.eval(context);
    return action(args, kwargs_eval);
};

Expression.FunctionApply.prototype.toString = function() {
    var args = this.args.map(function(arg) { return arg.toString(); }).join(", ");;
    for(var key in this.kwargs) {
        var s = key + " = " + this.kwargs[key].toString();
        if(args == "") args = s;
        else args += ", " + s;
    }
    return this.funcitem.toString() + "@(" + args + ")";
};

Expression.FunctionApply.prototype.clone = function() {
    var args = this.args.map(function(d) { return d.clone(); });
    var kwargs = { };
    for(var k in this.kwargs) {
        kwargs[k] = this.kwargs[k].clone();
    }
    return new Expression.Function(this.funcitem.clone(), args, kwargs);
};

Expression.Globals.sum = function(args) {
    var s = 0;
    for(var i = 0; i < args.length; i++) {
        s += +args[i];
    }
    return s;
};

Expression.Globals.count = function(args) {
    return args.length;
};

Expression.Globals.mean = function(args) {
    if(args.length == 0) return null;
    var s = 0;
    for(var i = 0; i < args.length; i++) {
        s += +args[i];
    }
    return s / args.length;
};

Expression.Globals.average = Expression.Globals.mean;
Expression.Globals.avg = Expression.Globals.mean;

Expression.Globals.median = function(args) {
    if(args.length == 0) return null;
    args.sort(function(a, b) { return a - b; });
    if(args.length % 2 == 0) {
        return (args[args.length / 2] + args[args.length / 2 - 1]) / 2;
    } else {
        return args[(args.length - 1) / 2];
    }
};

Expression.Globals.percentile = function(args, kwargs) {
    var p = kwargs.p !== undefined ? kwargs.p : 0.5;
    var arr = args.slice().sort(function(a, b) { return a - b; });
    if (p <= 0) return arr[0];
    if (p >= 1) return arr[arr.length - 1];

    var index = arr.length * p,
        lower = Math.floor(index),
        upper = lower + 1,
        weight = index % 1;

    if (upper >= arr.length) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
};

Expression.Globals.min = function(args) {
    if(args.length == 0) return null;
    var s = args[0];
    for(var i = 1; i < args.length; i++) {
        s = Math.min(s, +args[i]);
    }
    return s;
};

Expression.Globals.max = function(args) {
    if(args.length == 0) return null;
    var s = args[0];
    for(var i = 1; i < args.length; i++) {
        s = Math.max(s, +args[i]);
    }
    return s;
};

Expression.Globals.range = function(args, kwargs) {
    var min = null;
    var max = null;
    if(args[0] !== null && args[0] !== undefined) min = args[0];
    if(args[1] !== null && args[1] !== undefined) max = args[1];
    if(kwargs["min"] !== null && kwargs["min"] !== undefined) min = kwargs["min"];
    if(kwargs["max"] !== null && kwargs["max"] !== undefined) max = kwargs["max"];
    return [ min, max ];
};

var my_format = function(fmt) {
    if(fmt == "s") return function(s) { return s.toString(); };
    return d3.format(fmt);
};

Expression.Globals.format = function(args) {
    if(args.length == 0) return null;
    return my_format(args[0])(args[1]);
};

Expression.Globals.formatRange = function(args) {
    if(args.length == 0) return null;
    if(args[1][0] == args[1][1]) {
        return my_format(args[0])(args[1][0]);
    } else {
        return my_format(args[0])(args[1][0]) + " ~ " + my_format(args[0])(args[1][1]);
    }
};


Expression.Operators = { };

var CreateUnaryOperator = function(op, action) {
    var Operator = function(lh) {
        this.op = op;
        this.lh = lh;
    };
    Operator.prototype.eval = function(context) {
        return action(this.lh.eval(context));
    };
    Operator.prototype.toString = function() {
        return this.op + " " + this.lh.toString();
    };
    Operator.prototype.clone = function() {
        return new Operator(this.lh.clone());
    };
    return Operator;
};

var CreateBinaryOperator = function(op, action) {
    var Operator = function(lh, rh) {
        this.op = op;
        this.lh = lh;
        this.rh = rh;
    };
    Operator.prototype.eval = function(context) {
        return action(this.lh.eval(context), this.rh.eval(context));
    };
    Operator.prototype.toString = function() {
        return this.lh.toString() + " " + this.op + " " + this.rh.toString();
    };
    Operator.prototype.clone = function() {
        return new Operator(this.lh.clone(), this.rh.clone());
    };
    return Operator;
};

// Aritmetic operators, expect numeric types.
Expression.Operators["+"] = CreateBinaryOperator("+", function(a, b) { return (+a) + (+b); });
Expression.Operators["-"] = CreateBinaryOperator("-", function(a, b) { return (+a) - (+b); });
Expression.Operators["*"] = CreateBinaryOperator("*", function(a, b) { return (+a) * (+b); });
Expression.Operators["/"] = CreateBinaryOperator("/", function(a, b) { return (+a) / (+b); });
Expression.Operators["^"] = CreateBinaryOperator("^", function(a, b) { return Math.pow(+a, +b); });
Expression.Operators["unary:-"] = CreateUnaryOperator("unary:-", function(x) { return -x; });

// String operators.
Expression.Operators["&"] = CreateBinaryOperator("&", function(a, b) { return a.toString() + b.toString(); });

// Compare operators.
Expression.Operators[">"] = CreateBinaryOperator(">", function(a, b) { return a > b; });
Expression.Operators[">="] = CreateBinaryOperator(">=", function(a, b) { return a >= b; });
Expression.Operators["<"] = CreateBinaryOperator("<", function(a, b) { return a < b; });
Expression.Operators["<="] = CreateBinaryOperator("<=", function(a, b) { return a <= b; });
Expression.Operators["=="] = CreateBinaryOperator("==", function(a, b) { return a == b; });
Expression.Operators["!="] = CreateBinaryOperator("!=", function(a, b) { return a != b; });

// Boolean operators.
Expression.Operators["and"] = CreateBinaryOperator("and", function(a, b) { return a && b; });
Expression.Operators["or"] = CreateBinaryOperator("or", function(a, b) { return a || b; });
Expression.Operators["not"] = CreateUnaryOperator("not", function(a, b) { return !a; });

Expression.Operators["in"] = CreateBinaryOperator("in", function(a, b) {
    if(b instanceof Array) {
        var min = b[0];
        var max = b[1];
        return a >= min && a <= max;
    }
    return false;
});

var CreateOperator = function(op, lh, rh) {
    if(Expression.Operators[op]) {
        return new Expression.Operators[op](lh, rh);
    } else {
        throw new Error("Operator " + op + " not found.");
    }
}

function StripExtraZeros(number) {
    return number.toFixed(8).replace(/\.([0-9]*[1-9])0*$/, ".$1").replace(/\.0*$/, "")
}

// Number value.
Expression.Number = function(value) {
    this.value = value;
};
Expression.Number.prototype.eval = function(context) {
    return this.value;
};
Expression.Number.prototype.toString = function() {
    return StripExtraZeros(this.value);
};
Expression.Number.prototype.clone = function() {
    return new Expression.Number(this.value);
};

// String value.
Expression.String = function(value) {
    this.value = value;
};
Expression.String.prototype.eval = function(context) {
    return this.value;
};
Expression.String.prototype.toString = function() {
    return JSON.stringify(this.value);
};
Expression.String.prototype.clone = function() {
    return new Expression.String(this.value);
};

// Boolean value.
Expression.Boolean = function(value) {
    this.value = value;
};
Expression.Boolean.prototype.eval = function(context) {
    return this.value;
};
Expression.Boolean.prototype.toString = function() {
    return this.value ? "true" : "false"
};
Expression.Boolean.prototype.clone = function() {
    return new Expression.Boolean(this.value);
};

// Object value.
Expression.Object = function(value) {
    this.value = value;
};
Expression.Object.prototype.eval = function(context) {
    return this.value;
};
Expression.Object.prototype.toString = function() {
    return "[object]"
};
Expression.Object.prototype.clone = function() {
    return new Expression.Object(this.value);
};

Expression.Variable = function(name) {
    this.name = name;
};
Expression.Variable.prototype.eval = function(context) {
    var v = context.get(this.name);
    if(v === undefined) throw new Error("'" + this.name + "' is undefined.");
    return v;
};
Expression.Variable.prototype.toString = function() {
    return this.name;
};
Expression.Variable.prototype.clone = function() {
    return new Expression.Variable(this.name);
};


(function() {
/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */
(function(root) {
  "use strict";

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
          literal: function(expectation) {
            return "\"" + literalEscape(expectation.text) + "\"";
          },

          "class": function(expectation) {
            var escapedParts = "",
                i;

            for (i = 0; i < expectation.parts.length; i++) {
              escapedParts += expectation.parts[i] instanceof Array
                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                : classEscape(expectation.parts[i]);
            }

            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
          },

          any: function(expectation) {
            return "any character";
          },

          end: function(expectation) {
            return "end of input";
          },

          other: function(expectation) {
            return expectation.description;
          }
        };

    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }

    function literalEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g,  '\\"')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function classEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\^/g, '\\^')
        .replace(/-/g,  '\\-')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }

    function describeExpected(expected) {
      var descriptions = new Array(expected.length),
          i, j;

      for (i = 0; i < expected.length; i++) {
        descriptions[i] = describeExpectation(expected[i]);
      }

      descriptions.sort();

      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }

      switch (descriptions.length) {
        case 1:
          return descriptions[0];

        case 2:
          return descriptions[0] + " or " + descriptions[1];

        default:
          return descriptions.slice(0, -1).join(", ")
            + ", or "
            + descriptions[descriptions.length - 1];
      }
    }

    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };

  function peg$parse(input, options) {
    options = options !== void 0 ? options : {};

    var peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart, string_start: peg$parsestring_start },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = /^[^{}]/,
        peg$c1 = peg$classExpectation(["{", "}"], true, false),
        peg$c2 = function(str) { return new Expression.String(flatten(str)); },
        peg$c3 = "{",
        peg$c4 = peg$literalExpectation("{", false),
        peg$c5 = "}",
        peg$c6 = peg$literalExpectation("}", false),
        peg$c7 = function(expr) { return expr; },
        peg$c8 = function(names) { return new Expression.StringExpression(names); },
        peg$c9 = "and",
        peg$c10 = peg$literalExpectation("and", false),
        peg$c11 = "or",
        peg$c12 = peg$literalExpectation("or", false),
        peg$c13 = ">=",
        peg$c14 = peg$literalExpectation(">=", false),
        peg$c15 = ">",
        peg$c16 = peg$literalExpectation(">", false),
        peg$c17 = "<=",
        peg$c18 = peg$literalExpectation("<=", false),
        peg$c19 = "<",
        peg$c20 = peg$literalExpectation("<", false),
        peg$c21 = "==",
        peg$c22 = peg$literalExpectation("==", false),
        peg$c23 = "!=",
        peg$c24 = peg$literalExpectation("!=", false),
        peg$c25 = "in",
        peg$c26 = peg$literalExpectation("in", false),
        peg$c27 = "not",
        peg$c28 = peg$literalExpectation("not", false),
        peg$c29 = function(expr) { return CreateOperator("not", expr); },
        peg$c30 = function(left, others) { return gen_operator(left, others); },
        peg$c31 = /^[+&\-]/,
        peg$c32 = peg$classExpectation(["+", "&", "-"], false, false),
        peg$c33 = /^[*\/]/,
        peg$c34 = peg$classExpectation(["*", "/"], false, false),
        peg$c35 = /^[\^]/,
        peg$c36 = peg$classExpectation(["^"], false, false),
        peg$c37 = /^[\-]/,
        peg$c38 = peg$classExpectation(["-"], false, false),
        peg$c39 = function(op, expr) {
                var k = "unary:" + op;
                return CreateOperator(k, expr);
            },
        peg$c40 = "(",
        peg$c41 = peg$literalExpectation("(", false),
        peg$c42 = ")",
        peg$c43 = peg$literalExpectation(")", false),
        peg$c44 = function(name) { return new Expression.Variable(name); },
        peg$c45 = "=",
        peg$c46 = peg$literalExpectation("=", false),
        peg$c47 = function(name, expr) { return [ name, expr ] },
        peg$c48 = function(expr) { return [ expr ] },
        peg$c49 = ",",
        peg$c50 = peg$literalExpectation(",", false),
        peg$c51 = function(expr, other) { return [ expr ].concat(other) },
        peg$c52 = function(source_args) {
              var args = [];
              var kwargs_map = { };
              for(var i = 0; i < source_args.length; i++) {
                if(source_args[i].length == 2) {
                  kwargs_map[source_args[i][0]] = source_args[i][1];
                } else {
                  args.push(source_args[i][0]);
                }
              }
              return [ args, kwargs_map ];
            },
        peg$c53 = function() { return [ [], {} ]; },
        peg$c54 = function(funcitem, arglist) { return new Expression.Function(funcitem, arglist[0], arglist[1]); },
        peg$c55 = "@",
        peg$c56 = peg$literalExpectation("@", false),
        peg$c57 = function(funcitem, arglist) { return new Expression.FunctionApply(funcitem, arglist[0], arglist[1]); },
        peg$c58 = "[",
        peg$c59 = peg$literalExpectation("[", false),
        peg$c60 = "]",
        peg$c61 = peg$literalExpectation("]", false),
        peg$c62 = function(funcitem, expr) { return new Expression.Subscription(funcitem, expr); },
        peg$c63 = function(expr) { return new Expression.Subscription(new Expression.Variable("data"), expr); },
        peg$c64 = "..",
        peg$c65 = peg$literalExpectation("..", false),
        peg$c66 = function(expr1, expr2) { return new Expression.Function(new Expression.Variable("range"), [expr1, expr2], {}) },
        peg$c67 = /^[+\-]/,
        peg$c68 = peg$classExpectation(["+", "-"], false, false),
        peg$c69 = /^[0-9]/,
        peg$c70 = peg$classExpectation([["0", "9"]], false, false),
        peg$c71 = ".",
        peg$c72 = peg$literalExpectation(".", false),
        peg$c73 = /^[eE]/,
        peg$c74 = peg$classExpectation(["e", "E"], false, false),
        peg$c75 = function(str) { return new Expression.Number(parseFloat(flatten(str))); },
        peg$c76 = "true",
        peg$c77 = peg$literalExpectation("true", false),
        peg$c78 = function() { return new Expression.Boolean(true); },
        peg$c79 = "false",
        peg$c80 = peg$literalExpectation("false", false),
        peg$c81 = function() { return new Expression.Boolean(false); },
        peg$c82 = "\"",
        peg$c83 = peg$literalExpectation("\"", false),
        peg$c84 = /^[^"]/,
        peg$c85 = peg$classExpectation(["\""], true, false),
        peg$c86 = function(repr) { var str = JSON.parse(flatten(repr)); return new Expression.String(str); },
        peg$c87 = /^[a-zA-Z_]/,
        peg$c88 = peg$classExpectation([["a", "z"], ["A", "Z"], "_"], false, false),
        peg$c89 = /^[a-zA-Z0-9_]/,
        peg$c90 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_"], false, false),
        peg$c91 = function(name) { return flatten(name); },
        peg$c92 = /^[ \n]/,
        peg$c93 = peg$classExpectation([" ", "\n"], false, false),

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1 }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildStructuredError(
        [peg$otherExpectation(description)],
        input.substring(peg$savedPos, peg$currPos),
        location
      );
    }

    function error(message, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildSimpleError(message, location);
    }

    function peg$literalExpectation(text, ignoreCase) {
      return { type: "literal", text: text, ignoreCase: ignoreCase };
    }

    function peg$classExpectation(parts, inverted, ignoreCase) {
      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }

    function peg$anyExpectation() {
      return { type: "any" };
    }

    function peg$endExpectation() {
      return { type: "end" };
    }

    function peg$otherExpectation(description) {
      return { type: "other", description: description };
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos], p;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column
        };

        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildSimpleError(message, location) {
      return new peg$SyntaxError(message, null, null, location);
    }

    function peg$buildStructuredError(expected, found, location) {
      return new peg$SyntaxError(
        peg$SyntaxError.buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parsestart() {
      var s0;

      s0 = peg$parseexpression();

      return s0;
    }

    function peg$parsestring_start() {
      var s0;

      s0 = peg$parsestringexpr();

      return s0;
    }

    function peg$parsestringexpr_item() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c0.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c1); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c0.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c1); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c2(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
          s1 = peg$c3;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c4); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseexpression();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 125) {
              s3 = peg$c5;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c6); }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c7(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parsestringexpr() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsestringexpr_item();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsestringexpr_item();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c8(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseexpression() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesp();
      if (s1 !== peg$FAILED) {
        s2 = peg$parselevel_expression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesp();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c7(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parselevel_expression() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parselevelm0();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c7(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parselogic_operators() {
      var s0;

      if (input.substr(peg$currPos, 3) === peg$c9) {
        s0 = peg$c9;
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c10); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c11) {
          s0 = peg$c11;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c12); }
        }
      }

      return s0;
    }

    function peg$parsecompare_operators() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c13) {
        s0 = peg$c13;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c14); }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 62) {
          s0 = peg$c15;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c16); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c17) {
            s0 = peg$c17;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c18); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 60) {
              s0 = peg$c19;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c20); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c21) {
                s0 = peg$c21;
                peg$currPos += 2;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c22); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c23) {
                  s0 = peg$c23;
                  peg$currPos += 2;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c24); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 2) === peg$c25) {
                    s0 = peg$c25;
                    peg$currPos += 2;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c26); }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parselevelm0() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c27) {
        s1 = peg$c27;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c28); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesp();
        if (s2 !== peg$FAILED) {
          s3 = peg$parselevelm0();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c29(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parselevel0();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parsesp();
          if (s4 !== peg$FAILED) {
            s5 = peg$parselogic_operators();
            if (s5 !== peg$FAILED) {
              s6 = peg$parsesp();
              if (s6 !== peg$FAILED) {
                s7 = peg$parselevel0();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parsesp();
            if (s4 !== peg$FAILED) {
              s5 = peg$parselogic_operators();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsesp();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parselevel0();
                  if (s7 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c30(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parselevel0() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parselevel1();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsesp();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsecompare_operators();
          if (s5 !== peg$FAILED) {
            s6 = peg$parsesp();
            if (s6 !== peg$FAILED) {
              s7 = peg$parselevel1();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsesp();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsecompare_operators();
            if (s5 !== peg$FAILED) {
              s6 = peg$parsesp();
              if (s6 !== peg$FAILED) {
                s7 = peg$parselevel1();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c30(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parselevel1() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parselevel2();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsesp();
        if (s4 !== peg$FAILED) {
          if (peg$c31.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c32); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsesp();
            if (s6 !== peg$FAILED) {
              s7 = peg$parselevel2();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsesp();
          if (s4 !== peg$FAILED) {
            if (peg$c31.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c32); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsesp();
              if (s6 !== peg$FAILED) {
                s7 = peg$parselevel2();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c30(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parselevel2() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parselevel3();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsesp();
        if (s4 !== peg$FAILED) {
          if (peg$c33.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c34); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsesp();
            if (s6 !== peg$FAILED) {
              s7 = peg$parselevel3();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsesp();
          if (s4 !== peg$FAILED) {
            if (peg$c33.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c34); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsesp();
              if (s6 !== peg$FAILED) {
                s7 = peg$parselevel3();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c30(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parselevel3() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parselevel4();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsesp();
        if (s4 !== peg$FAILED) {
          if (peg$c35.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c36); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsesp();
            if (s6 !== peg$FAILED) {
              s7 = peg$parselevel4();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsesp();
          if (s4 !== peg$FAILED) {
            if (peg$c35.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c36); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsesp();
              if (s6 !== peg$FAILED) {
                s7 = peg$parselevel4();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c30(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parselevel4() {
      var s0, s1, s2;

      s0 = peg$parseitem();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (peg$c37.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c38); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseitem();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c39(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseitem() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$parseprimitive();
      if (s0 === peg$FAILED) {
        s0 = peg$parsefunction_call();
        if (s0 === peg$FAILED) {
          s0 = peg$parsefunction_apply();
          if (s0 === peg$FAILED) {
            s0 = peg$parsesubscription();
            if (s0 === peg$FAILED) {
              s0 = peg$parserange_expr();
              if (s0 === peg$FAILED) {
                s0 = peg$parsevariable();
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 40) {
                    s1 = peg$c40;
                    peg$currPos++;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c41); }
                  }
                  if (s1 !== peg$FAILED) {
                    s2 = peg$parsesp();
                    if (s2 !== peg$FAILED) {
                      s3 = peg$parselevelm0();
                      if (s3 !== peg$FAILED) {
                        s4 = peg$parsesp();
                        if (s4 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 41) {
                            s5 = peg$c42;
                            peg$currPos++;
                          } else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c43); }
                          }
                          if (s5 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c7(s3);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsefuncitem() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$parsevariable();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s1 = peg$c40;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c41); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsesp();
          if (s2 !== peg$FAILED) {
            s3 = peg$parselevelm0();
            if (s3 !== peg$FAILED) {
              s4 = peg$parsesp();
              if (s4 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s5 = peg$c42;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c43); }
                }
                if (s5 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c7(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parsevariable() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsevariable_name();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c44(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseargitem() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsekw_name();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesp();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s3 = peg$c45;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c46); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesp();
            if (s4 !== peg$FAILED) {
              s5 = peg$parselevel_expression();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c47(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parselevel_expression();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c48(s1);
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseargitems() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseargitem();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesp();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c49;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c50); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesp();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseargitems();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c51(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseargitem();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c48(s1);
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseargitem_list() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c40;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c41); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesp();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseargitems();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesp();
            if (s4 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s5 = peg$c42;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c43); }
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c52(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s1 = peg$c40;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c41); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsesp();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s3 = peg$c42;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c43); }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c53();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parsefunction_call() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsefuncitem();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesp();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseargitem_list();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c54(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefunction_apply() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsefuncitem();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesp();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 64) {
            s3 = peg$c55;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c56); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesp();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseargitem_list();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c57(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesubscription() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parsefuncitem();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesp();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 91) {
            s3 = peg$c58;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c59); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesp();
            if (s4 !== peg$FAILED) {
              s5 = peg$parselevel_expression();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsesp();
                if (s6 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 93) {
                    s7 = peg$c60;
                    peg$currPos++;
                  } else {
                    s7 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c61); }
                  }
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c62(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
          s1 = peg$c58;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c59); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsesp();
          if (s2 !== peg$FAILED) {
            s3 = peg$parselevel_expression();
            if (s3 !== peg$FAILED) {
              s4 = peg$parsesp();
              if (s4 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 93) {
                  s5 = peg$c60;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c61); }
                }
                if (s5 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c63(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parserange_expr() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c58;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c59); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesp();
        if (s2 !== peg$FAILED) {
          s3 = peg$parselevel_expression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesp();
            if (s4 !== peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c64) {
                s5 = peg$c64;
                peg$currPos += 2;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c65); }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parsesp();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parselevel_expression();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsesp();
                    if (s8 !== peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 93) {
                        s9 = peg$c60;
                        peg$currPos++;
                      } else {
                        s9 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c61); }
                      }
                      if (s9 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c66(s3, s7);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseprimitive() {
      var s0;

      s0 = peg$parsefloating_point();
      if (s0 === peg$FAILED) {
        s0 = peg$parseboolean();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestring();
        }
      }

      return s0;
    }

    function peg$parsefloating_point() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (peg$c67.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c68); }
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        if (peg$c69.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c70); }
        }
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            if (peg$c69.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c70); }
            }
          }
        } else {
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 46) {
            s5 = peg$c71;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c72); }
          }
          if (s5 !== peg$FAILED) {
            s6 = [];
            if (peg$c69.test(input.charAt(peg$currPos))) {
              s7 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s7 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c70); }
            }
            if (s7 !== peg$FAILED) {
              while (s7 !== peg$FAILED) {
                s6.push(s7);
                if (peg$c69.test(input.charAt(peg$currPos))) {
                  s7 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s7 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c70); }
                }
              }
            } else {
              s6 = peg$FAILED;
            }
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$currPos;
            if (peg$c73.test(input.charAt(peg$currPos))) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c74); }
            }
            if (s6 !== peg$FAILED) {
              if (peg$c67.test(input.charAt(peg$currPos))) {
                s7 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s7 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c68); }
              }
              if (s7 === peg$FAILED) {
                s7 = null;
              }
              if (s7 !== peg$FAILED) {
                s8 = [];
                if (peg$c69.test(input.charAt(peg$currPos))) {
                  s9 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s9 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c70); }
                }
                if (s9 !== peg$FAILED) {
                  while (s9 !== peg$FAILED) {
                    s8.push(s9);
                    if (peg$c69.test(input.charAt(peg$currPos))) {
                      s9 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s9 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c70); }
                    }
                  }
                } else {
                  s8 = peg$FAILED;
                }
                if (s8 !== peg$FAILED) {
                  s6 = [s6, s7, s8];
                  s5 = s6;
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
            if (s5 === peg$FAILED) {
              s5 = null;
            }
            if (s5 !== peg$FAILED) {
              s2 = [s2, s3, s4, s5];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c75(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseboolean() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c76) {
        s1 = peg$c76;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c77); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c78();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 5) === peg$c79) {
          s1 = peg$c79;
          peg$currPos += 5;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c80); }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c81();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parsestring() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s2 = peg$c82;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c83); }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        if (peg$c84.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c85); }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c84.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c85); }
          }
        }
        if (s3 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s4 = peg$c82;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c83); }
          }
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c86(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsekw_name() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (peg$c87.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c88); }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        if (peg$c89.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c90); }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c89.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c90); }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c91(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsevariable_name() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (peg$c87.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c88); }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        if (peg$c89.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c90); }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c89.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c90); }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c91(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsesp() {
      var s0, s1;

      s0 = [];
      if (peg$c92.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c93); }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$c92.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c93); }
        }
      }

      return s0;
    }


        function flatten(vars) {
            if(vars instanceof Array) {
                var r = "";
                for(var i = 0; i < vars.length; i++)
                    r += flatten(vars[i]);
                return r;
            } else return vars || "";
        }
        function gen_operator(left, others) {
            var r = left;
            for(var i = 0; i < others.length; i++) {
                var op = flatten(others[i][1]);
                var rh = others[i][3];
                r = CreateOperator(op, r, rh);
            }
            return r;
        }


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail(peg$endExpectation());
      }

      throw peg$buildStructuredError(
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  root.Expression.Parser = {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})(this);

}).call({ Expression: Expression });

Expression.StringExpression = function(exprs) {
    this.exprs = exprs;
};
Expression.StringExpression.prototype.eval = function(context) {
    return this.exprs.map(function(d) { return d.eval(context).toString(); }).join("");
};
Expression.StringExpression.prototype.toString = function(context) {
    return this.exprs.map(function(d) {
        if(d instanceof Expression.String) return d.value;
        return "{" + d.toString() + "}";
    }).join("");
};
Expression.StringExpression.prototype.clone = function() {
    return new Expression.StringExpression(this.exprs.map(function(d) { return d.clone(); }));
};

Expression.parse = function(expr) {
    return Expression.Parser.parse(expr);
    // parsed_expression.toString = function() { return expr; };
    // return parsed_expression;
};

Expression.parseStringExpression = function(expr) {
    return Expression.Parser.parse(expr, { startRule: "string_start" });
    // parsed_expression.toString = function() { return expr; };
    // return parsed_expression;
};

Expression.toStringExpression = function(expr) {
    if(expr instanceof Expression.StringExpression) {
        return expr.toString();
    } else {
        return "{" + expr.toString() + "}";
    }
};

// Probing functions.
Expression.isNumberValue = function(x) {
    return x instanceof Expression.Number;
};
Expression.isStringValue = function(x) {
    return x instanceof Expression.String;
};
Expression.isBooleanValue = function(x) {
    return x instanceof Expression.Boolean;
};
Expression.isValue = function(x) {
    return Expression.isNumberValue(x) ||
           Expression.isStringValue(x) ||
           Expression.isBooleanValue(x);
};

Expression.isStringExpression = function(x) {
    return x instanceof Expression.StringExpression;
};

Expression.isSimpleFunction = function(expr, funcname) {
    return expr instanceof Expression.Function && expr.funcitem instanceof Expression.Variable && expr.funcitem.name == funcname;
};
Expression.isSimpleFunctionApply = function(expr, funcname) {
    return expr instanceof Expression.FunctionApply && expr.funcitem instanceof Expression.Variable && expr.funcitem.name == funcname;
};

Expression.safeEval = function(expr, context) {
    try {
        return expr.eval(context);
    } catch(e) {
        return "#{Error: " + e.message + "}"
    }
};

Expression.safeEvalAsString = function(expr, context) {
    var r = Expression.safeEval(expr, context);
    // console.log(r, typeof(r));
    if(typeof(r) != "string") {
        // console.log(r, typeof(r));
        if(typeof(r) == "number") {
            r = StripExtraZeros(r);
        }
        return r.toString();
    } else {
        return r;
    }
};

Expression.createNumberRange = function(min, max) {
    return new Expression.Function(new Expression.Variable("range"), [ new Expression.Number(min), new Expression.Number(max) ]);
};

Expression.createStringRange = function(min, max) {
    return new Expression.Function(new Expression.Variable("range"), [ new Expression.String(min), new Expression.String(max) ]);
};

Expression.createRegion = function(range) {
    return new Expression.Function(new Expression.Variable("Region"), [ new Expression.String(min), new Expression.String(max) ]);
};

Expression.toEasyString = function(expression) {
    var text, format;
    if(Expression.isStringValue(expression)) {
        text = expression.value;
    } else if(Expression.isStringExpression(expression)) {
        text = expression.exprs.map(function(d) {
            if(Expression.isStringValue(d)) return d.value;
            format = d;
            return "##";
        }).join("");
        if(!format) format = expression._saved_format_;
    } else {
        format = expression;
        text = "##";
    }
    return {
        text: text,
        format: format
    };

};

Expression.parseEasyString = function(str, format) {
    var txt = str.split("##");
    var exprs = [];
    for(var k = 0; k < txt.length; k++) {
        exprs.push(new Expression.String(txt[k]));
        if(k != txt.length - 1) {
            exprs.push(format);
        }
    }
    var r = new Expression.StringExpression(exprs);
    r._saved_format_ = format;
    return r;
}


Expression.Test = function(tester) {
    var test_cases = [
        [ "1 + 2 * 3 - 4 - (-7 + 5 * 6)", -20 ],
        [ "-3 + 5", 2 ],
        [ "-5^3", -125 ],
        [ "--5^3", 125 ],
        [ "3--5^3", 128 ],
        [ "3-(-5)^3", 128 ],
        [ "a + b + sum(1,2,3,4) - (1+2-3*4)", 30 ],
        [ '"The value of a is: " & a', "The value of a is: 1" ],
        [ "1 + 2 < 3 + 4", true ],
        [ "1 + 2 == 3 + 4 - 4", true ],
        [ "1 + 2 == 3 + 4", false ],
        [ "3 * 4 <= 4 * 3", true ],
        [ "3 > 1 and 5 < 8 ", true ],
        [ "not a == 1", false ],
        [ "true == (a == 1)", true ],
        [ "false == (a == 1)", false ],
        [ "min(1,2,3,4) == 1 and max(1,2,3,4,5) != 4", true ],
        [ "mean(1,2,3,4)", 2.5 ],
        [ "value + 5", 13 ],
        [ "sum(filter=3)", 0 ],
        [ "range(max=1, min = 3+5)", [ 8, 1 ] ],
        [ "mean(1,2,3,4,filter=true)", 2.5 ],
        [ 'max@(value, [key == "A"])', 1 ],
        [ 'max@(value)', 3 ],
        [ '[key == "A"]', [ { key: "A", value: 1 } ] ]
    ]

    var string_test_cases = [
        [ 'This is value: {value}', "This is value: 8" ]
    ];

    var context = Expression.CreateContext({
        a: 1, b: 10,
        value: 8,
        data: [
            { key: "A", value: 1 },
            { key: "B", value: 2 },
            { key: "C", value: 3 }
        ]
    });

    test_cases.forEach(function(ci) {
        var expr = ci[0];
        var expected = ci[1];

        try {
            var e = new Expression.parse(expr);
        } catch(exception) {
            console.log(ci, exception);
            return;
        }
        var returned = e.eval(context);
        tester.deepEqual(returned, expected, expr);
    });

    tester.ok(Expression.isValue(Expression.parse('1')));
    tester.ok(Expression.isValue(Expression.parse('1+3')) == false);
    tester.ok(Expression.isValue(Expression.parse('"test"')) == true);
    tester.done();
};


return Expression;

})();

Module.Expression = Expression;

// InputWidget.

var ExpressionWidgets = { };

ExpressionWidgets.Create = function(owner, container, expression) {
    var WidgetClass = ExpressionWidgets[expression.type];
    return new WidgetClass(owner, container, expression);
};

ExpressionWidgets.string = function(owner, container, expression) {
    this.owner = owner;
    this.expression = expression;
    this.current_cursor_position = null;
    this.current_selection_start = null;

    var self = this;
    var input = container.append("span")
    .text(expression.value);
    this.input = input;
};

// ExpressionWidgets.string = function(owner, container, expression) {
//     this.owner = owner;
//     this.expression = expression;
//     this.current_cursor_position = null;
//     this.current_selection_start = null;

//     var self = this;
//     var input = container.append("span")
//     .text(expression.value)
//     .style({
//         "border": "none", "outline": "none", "margin": "none", "padding": "none",
//         "font-family": owner.style.font_family,
//         "font-size": owner.style.font_size + "px",
//         "line-height": owner.style.line_height + "px",
//         "height": owner.style.height + "px",
//         "background": "#F0F0F0",
//         "min-width": "5px",
//         "display": "inline-block"
//     });
//     input.node().caHandleInputEvent = this._handleChange.bind(this);
//     this.input = input;
// };
// ExpressionWidgets.string.prototype.doInsert = function(expression) {
//     if(this.current_selection_start !== null) {
//         var v1 = this.expression.value.substr(0, this.current_selection_start);
//         var v2 = this.expression.value.substr(this.current_selection_start);

//         var sequence = []

//         if(v1.length != 0) sequence.push({ type: "string", value: v1 });
//         sequence.push(expression);
//         if(v2.length != 0) sequence.push({ type: "string", value: v2 });

//         Events.raise(this, "replace", {
//             type: "concat",
//             sequence: sequence
//         });
//     }
// };
// ExpressionWidgets.string.prototype._handleChange = function(event_type) {
//     console.log("Event: " + event_type);
//     if(this.expression.value != this.input.text()) {
//         this.expression.value = this.input.text();
//         if(this.expression.value == "") {
//             Events.raise(this, "remove");
//         } else {
//             Events.raise(this, "change");
//         }
//     }
//     var sel = window.getSelection();
//     if(sel && event_type != "blur") {
//         var focus_node = sel.focusNode;
//         while(focus_node && focus_node != this.input.node()) {
//             focus_node = focus_node.parentNode;
//         }
//         if(focus_node == this.input.node()) {
//             var selection_start = sel.focusOffset;
//             var offset = this.owner._measureText(this.input.text().substr(0, selection_start));
//             var left = this.input.node().getBoundingClientRect().left + offset;
//             var top = this.input.node().getBoundingClientRect().top + this.input.node().getBoundingClientRect().height;
//             this.current_selection_start = selection_start;
//             if(left != this.current_cursor_position) {
//                 this.current_cursor_position = left;
//                 Events.raise(this, "cursor", this, left, top);
//             }
//             return;
//         }
//     }
//     if(null !== this.current_cursor_position) {
//         this.current_cursor_position = null;
//         this.current_selection_start = null;
//         Events.raise(this, "cursor", null, null, null);
//     }
// };

ExpressionWidgets.concat = function(owner, container, expression) {
    this.owner = owner;
    this.expression = expression;
    var self = this;

    expression.sequence.forEach(function(subexpression, index) {
        var subcontainer = container.append("span");
        var element = ExpressionWidgets.Create(owner, subcontainer, subexpression);
        // var do_replace = function(new_expression) {
        //     expression.sequence[index] = new_expression;
        //     subcontainer.selectAll("*").remove();
        //     element = ExpressionWidgets.Create(owner, subcontainer, new_expression);

        //     Events.on(element, "cursor", Events.raise.bind(Events, self, "cursor"));
        //     Events.on(element, "replace", do_replace);
        //     Events.raise(self, "change");
        // }
        // Events.on(element, "cursor", Events.raise.bind(Events, self, "cursor"));
        // Events.on(element, "replace", do_replace);
        // Events.on(element, "remove", function() {
        //     expression.sequence.splice(index, 1);
        //     var previous_string_item = null;
        //     var new_sequence = [];
        //     for(var i = 0; i < expression.sequence.length; i++) {
        //         var si = expression.sequence[i];
        //         if(si.type == "string") {
        //             if(!previous_string_item) {
        //                 previous_string_item = si;
        //             } else {
        //                 previous_string_item.value += si.value;
        //             }
        //         } else {
        //             if(previous_string_item) {
        //                 if(previous_string_item.value != "") {
        //                     new_sequence.push(previous_string_item);
        //                 }
        //                 previous_string_item = null;
        //             }
        //             new_sequence.push(si);
        //         }
        //     }
        //     if(previous_string_item) {
        //         if(previous_string_item.value != "") {
        //             new_sequence.push(previous_string_item);
        //         }
        //     }
        //     expression.sequence = new_sequence;
        //     if(expression.sequence.length == 0) {
        //         Events.raise(self, "remove", expression);
        //     } else {
        //         Events.raise(self, "replace", expression);
        //     }
        // });
    });
};

ExpressionWidgets.function = function(owner, container, expression) {
};

ExpressionWidgets.column = function(owner, container, expression) {
    this.owner = owner;
    this.expression = expression;
    var self = this;

    container.append("span").text(expression.column)
    .attr("tabIndex", 0)
    .attr("contentEditable", false)
    .style({
        "-webkit-user-select": "none",
        "background": "#1f77b4",
        "color": "white",
        "padding": "0 2px",
        "border-radius": "2px",
        "display": "inline-block",
        "cursor": "pointer",
        "outline": "none",
        "margin": "0 2px"
    })
    .on("focus", function() {
        d3.select(this).style({
            "background": "#ff7f0e"
        });
    })
    .on("blur", function() {
        d3.select(this).style({
            "background": "#1f77b4"
        });
    })
    .on("keydown", function() {
        if(d3.event.keyCode == 8) {
            Events.raise(self, "remove");
            d3.event.preventDefault();
        }
    });
};


var ExpressionFunctions = {
    "Sum": {
        f: function() { return d3.sum(Array.prototype.slice.call(arguments)); },
        description: "Calculate the sum of values.",
        args: [ "Value*:Values" ],
        kwargs: {
            "Filter": "Only on items matching the given criterion."
        }
    }
};

var InputWidgetContext = function(schema) {
    this.columns = schema.columns;
};



var InputWidget = function(container) {
    this.style = {
        font_family: "Helvetica, Arial, sans-serif",
        font_size: 16,
        line_height: 20,
        height: 20,
    };

    this.canvas = document.createElement("canvas");
    this.canvas_context = this.canvas.getContext("2d");

    this.container = container;
    this.container
    .attr("contentEditable", true)
    .attr("class", "chartaccent-input-widget")
    .style({
        "-webkit-user-modify": "read-write-plaintext-only",
        "outline": "none",
        "font-family": this.style.font_family,
        "font-size": this.style.font_size + "px",
        "line-height": this.style.line_height + "px",
        "height": this.style.height + "px",
        "padding": "2px 5px",
        "display": "inline-block",
        "border": "1px solid #AAA",
        "box-shadow": "0 0 3px rgba(0,0,0,0.2) inset"
    });

    this.container.on("keydown", function() {
        console.log(d3.event.keyCode);
    });
    this.container.on("focus", this._handleInputEvent.bind(this, "focus"));
    this.container.on("blur", this._handleInputEvent.bind(this, "blur"));
    this.container.on("mouseup", this._handleInputEvent.bind(this, "mouseup"));
    this.container.on("keyup", this._handleInputEvent.bind(this, "keyup"));
    this.container.on("keydown", this._handleInputEvent.bind(this, "keydown"));
    this.container.on("paste", this._handleInputEvent.bind(this, "paste"));
    this.container.on("input", this._handleInputEvent.bind(this, "input"));
    this.container.on("select", this._handleInputEvent.bind(this, "select"));
    this.container.on("selectstart", this._handleInputEvent.bind(this, "selectstart"));

    this.expression = null;

    this._createSuggestionContainers();
};

InputWidget.prototype._handleInputEvent = function(event_type) {
    console.log("ROOT:" + event_type);

    var sel = window.getSelection();

    if(event_type == "blur") {
        this._changeCursor(null, null, null);
    } else if(sel && sel.type == "Caret") {
        var fnode = sel.focusNode;
        if(fnode instanceof Text) {
            var range = document.createRange();
            range.selectNodeContents(fnode);
            var client_rect = range.getClientRects();
            console.log(client_rect);
            client_rect = client_rect[0];

            var offset = this._measureText(fnode.textContent.substr(0, sel.focusOffset));

            fnode.caInsertPosition = sel.focusOffset;
            this._changeCursor(fnode, client_rect.left + offset, client_rect.top + client_rect.height + 5);
        } else {
            this._changeCursor(null, null, null);
        }
    }
};



InputWidget.prototype._raise = function() {
    Events.raise(this, "expression", this.expression);
};

InputWidget.prototype._measureText = function(text) {
    this.canvas_context.font = this.style.font_size + "px " + this.style.font_family;
    return this.canvas_context.measureText(text).width;
};

InputWidget.prototype.setContext = function(context) {
    this.context = context;
};

InputWidget.prototype._createSuggestionContainers = function() {
    this.suggestion_container = d3.select("body").append("chartaccent-suggestions")
    var left = this.suggestion_container.append("div")
    .style({
        "float": "left"
    });
    var right = this.suggestion_container.append("div")
    .style({
        "float": "left"
    });
    this.suggestion_container.append("div")
    .style({ "clear": "both" });

    left.append("h4").text("Columns")
    right.append("h4").text("Functions")

    this.suggestion_container.div_columns = left.append("div").attr("class", "columns item-list");
    this.suggestion_container.div_functions = right.append("div").attr("class", "functions item-list");
    this.suggestion_container.on("mousedown", function() {
        d3.event.preventDefault();
    });
};
InputWidget.prototype._renderSuggestion = function(element) {
    var self = this;
    var s = this.suggestion_container.div_columns.selectAll("div").data(this.context.columns);
    s.enter().append("div");
    s.exit().remove();
    s.text(function(d) { return d.name; });
    s.on("click", function(d) {
        if(element instanceof Text) {
            var position = element.caInsertPosition;
            var text = element.textContent;
            var v1 = text.substr(0, position);
            var v2 = text.substr(position);
            var parent = element.parentNode;
            var span_new = document.createElement("span");
            parent.insertBefore(span_new, element);
            var text_v2 = document.createTextNode("");
            parent.insertBefore(text_v2, span_new);

            element.textContent = v2;
            text_v2.textContent = v1;

            var enew = ExpressionWidgets.Create(this, d3.select(span_new), {
                type: "column",
                column: d.name
            });
            self.suggestion_container.style("display", "none");
        }
    });
};

InputWidget.prototype._changeCursor = function(node, offset_x, offset_y) {
    this.suggestion_container.style("display", "none");
    if(this.timer_do_change_cursor) {
        clearTimeout(this.timer_do_change_cursor);
    }
    this.timer_do_change_cursor = setTimeout(function() {
        if(node === null || offset_x === null || offset_y === null) {
            this.suggestion_container.style("display", "none");
        } else {
            this.suggestion_container
            .style({
                "display": "block",
                "left": Math.round(offset_x) + "px",
                "top": Math.round(offset_y) + "px"
            });
            this._renderSuggestion(node);
        }
    }.bind(this), 300);
};

InputWidget.prototype._renderExpression = function(container, expression) {
    var self = this;
    var element = ExpressionWidgets.Create(this, container, expression);
    // Events.on(element, "cursor", function(subelement, offset_x, offset_y) {
    //     self._changeCursor(subelement, offset_x, offset_y);
    // });
    return element;
};

InputWidget.prototype.setExpression = function(expression) {
    var self = this;
    this.container.selectAll("*").remove();
    this.expression = expression;

    var element = this._renderExpression(this.container, this.expression);

    Events.on(element, "change", function() {
        console.log(expression);
    });
    Events.on(element, "remove", function(new_expr) {
        self.setExpression({ type: "string", "value": "" });
    });
    Events.on(element, "replace", function(new_expr) {
        self.setExpression(new_expr);
    });
};

Module.InputWidget = InputWidget;
Module.InputWidgetContext = InputWidgetContext;


var CreateEditorPopup = function(name, info) {
    var wrapper = MakeEditorPopupWrapper(info);
    var popup = new (EditorPopups[name])(info, wrapper);
    Events.on(wrapper, "remove", function() { Events.raise(popup, "remove"); });
    return popup;
};

var MakeEditorPopupWrapper = function(info) {
    var wrapper = d3.select("body").append("chartaccent-popout");

    var target_rect = info.anchor.getBoundingClientRect();
    var body_rect = document.body.parentNode.getBoundingClientRect();

    wrapper.style({
        "left": (target_rect.left - body_rect.left) + "px",
        "top": (target_rect.top - body_rect.top + target_rect.height + 6) + "px"
    });

    wrapper.append("div").classed("border-triangle", true);

    if(info.align == "right") {
        wrapper.style({
            "right": -(target_rect.right - body_rect.right) + "px",
            "left": null
        });
    }
    wrapper.style({
        "position": "absolute",
        "z-index": "1000000",
        "background": "white",
        "border": "1px solid #444",
        "box-shadow": "0 0 2px rgba(0,0,0,0.3)"
    });

    var clickout_handler = setupClickoutHandlers(wrapper, function(type) {
        if(!info.onClickout || info.onClickout()) {
            wrapper.remove();
            Events.raise(wrapper, "remove");
            return true;
        } else {
            return false;
        }
    }, info.parent_clickout_handlers);

    info.remove = function() {
        wrapper.remove();
        clickout_handler.remove();
    };

    return wrapper;
};

var EditorPopups = { };

EditorPopups.ColorPicker = function(info, wrapper) {
    wrapper.classed("color-picker", true);

    var self = this;
    var current_color = info.color;

    // A color picker similar to microsoft products.

    // The "Theme" colors.
    var main_colors = ["#000", "#FFF",  "#5CA3D1", "#9BBE42", "#F0B04F", "#9F8AC1", "#E16B9E", "#44B29C", "#E27166"];

    // for(var i = 0; i < main_colors.length; i++) {
    //     colors = colors.concat(chroma.scale(["#000", main_colors[i]], 'lab').colors(5).slice(1, -1));
    //     colors = colors.concat(chroma.scale([main_colors[i], '#FFF'], 'lab').colors(6).slice(0,-1));
    // }
    // colors = colors.map(function(x) { return new RGBColor(x); });

    var adjust_brightness = function(color, l) {
        var lab = chroma(color).lab();
        lab[0] = l * 100;
        return chroma(lab, "lab");
    };

    var p = wrapper.append("p").classed("btn-none", true).on("click", function(d) {
        Events.raise(self, "color", null);
        info.remove();
    });
    p.call(IconFont.addIcon("cross"))
    p.append("span").text(" None");

    var columns = wrapper.append("p").selectAll("span.column").data(main_colors).enter().append("span").attr("class", "column");
    columns.style({
        display: "inline-block",
        width: "28px",
        "margin-right": "3px"
    });
    columns.append("span").append("span").attr("class", "color").on("click", function(d) {
        if(current_color) {
            var a = current_color.a;
            current_color = new RGBColor(d);
            current_color.a = a;
        } else {
            current_color = new RGBColor(d);
        }
        update_current_color();
        Events.raise(self, "color", current_color);
    })
    .style("margin-bottom", "8px")
    .append("span").attr("class", "content").style({
        "background-color": function(d) { return d.toString(); }
    });
    columns.append("span").selectAll("span.color").data(function(d) {
        if(d == "#000") {
            return chroma.scale(["#888", "#000"], "lab").colors(8).slice(1, -1);
        }
        if(d == "#FFF") {
            return chroma.scale(["#FFF", "#888"], "lab").colors(8).slice(1, -1);
        }
        return [ 1, 0.95, 0.85, 0.7, 0.5, 0.3 ].map(function(v) { return adjust_brightness(d, v).toString(); });
    }).enter().append("span").attr("class", "color")
        .on("click", function(d) {
            if(current_color) {
                var a = current_color.a;
                current_color = new RGBColor(d);
                current_color.a = a;
            } else {
                current_color = new RGBColor(d);
            }
            update_current_color();
            Events.raise(self, "color", current_color);
        })
        .append("span").attr("class", "content").style({
            "background-color": function(d) { return d.toString(); }
        });

    var p = wrapper.append("footer").style({
        "line-height": "28px",
        "text-align": "right"
    });
    var alpha_editor = p.append("span");
    alpha_editor.append("span").text("Opacity ");
    var opacity_slider = alpha_editor.append("span");
    MakeNumberSlider(opacity_slider, current_color ? current_color.a : 1.0, [ 0, 1 ], function(new_alpha) {
        if(current_color) {
            current_color = current_color.clone();
            current_color.a = new_alpha;
            update_current_color();
            Events.raise(self, "color", current_color);
        }
    }, 140);
    if(info.disable_alpha) alpha_editor.remove();

    p.append("span").text(" ");
    p.append("span").classed("btn", true).text("OK")
        .on("click", function(d) {
            info.remove();
        });
    // wrapper.style({
    //     "width": "231px"
    // });
    var update_current_color = function() {
        // rect_alpha.attr("x", (current_color ? current_color.a : 1.0) * 90 + 5 - 2);
        alpha_editor.style("display", current_color ? "inline" : "none");
    };
    update_current_color();
};

EditorPopups.Select = function(info, wrapper) {
    var self = this;
    var value = info.value;
    wrapper.classed("select", true);
    var ps = wrapper.append("ul").selectAll("li").data(info.choices);
    var li = ps.enter().append("li")
    li.append("span").call(IconFont.addIcon("correct")).classed("mark", true);
    li.append("label")
        .text(function(d) { return d.name; })
        .style({
            "font-family": function(d) { return d.font ? d.font : null; }
        });
    ps.classed("active", function(d) { return value == d.value; });
    ps.on("click", function(d) {
        Events.raise(self, "value", d.value);
        info.remove();
    });
};

EditorPopups.LabelAnchorSelect = function(info, wrapper) {
    var self = this;
    wrapper.classed("anchor-select", true);
    var svg = wrapper.append("svg").attr("width", 140).attr("height", 90);
    var g = svg.append("g").attr("transform", "translate(70, 45)");
    var w = 81, h = 51;
    var spacing_x = w / 3, size_x = spacing_x - 6;
    var spacing_y = h / 3, size_y = spacing_y - 6;
    var bg = g.append("rect").attr("x", -w / 2).attr("y", -h / 2).attr("width", w).attr("height", h)
        .style({
            "stroke": "#ff7f0e",
            "fill": "#ff7f0e",
            "fill-opacity": 0.2,
            "stroke-width": 2,
        });
    g.append("g").selectAll("g").data([-2,-1,0,1,2]).enter().append("g").selectAll("rect").data(function(d) {
        return [[d,-2],[d,-1],[d,0],[d,1],[d,2]];
    }).enter().append("rect")
        .classed("anchor", true)
        .attr("x", function(d) { return d[0] * spacing_x - size_x / 2; })
        .attr("y", function(d) { return d[1] * spacing_y - size_y / 2; })
        .attr("width", size_x)
        .attr("height", size_y)
        .style({
            "stroke": "black",
            "cursor": "pointer",
        })
        .attr("stroke-dasharray", "2, 2")
        .on("click", function(d) {
            var xs = { 0: "ll", 1: "l", 2: "m", 3: "r", 4: "rr" };
            var ys = { 0: "tt", 1: "t", 2: "m", 3: "b", 4: "bb" };
            Events.raise(self, "value", xs[d[0] + 2] + "," + ys[d[1] + 2]);
            info.remove();
        }).classed("active", function(d) {
            var xs = { 0: "ll", 1: "l", 2: "m", 3: "r", 4: "rr" };
            var ys = { 0: "tt", 1: "t", 2: "m", 3: "b", 4: "bb" };
            return info.value == xs[d[0] + 2] + "," + ys[d[1] + 2];
        });
};

// info: {
//    serieses: [ "name1", "name2", ... ]
//    modes: [ "mode1", "mode2", ... ]
//    default_mode: "mode1"
// }
EditorPopups.SelectItems = function(info, wrapper) {
    var self = this;

    var selected_serieses = new Set(info.serieses);
    var selected_mode = info.default_mode;
    var include_equal = info.default_include_equal;

    wrapper.append("h3").text("Mode");
    MakeSwitchButton(wrapper.append("p").append("span"), selected_mode, info.modes, function(newmode) {
        selected_mode = newmode;
    });

    if(info.show_include_equal) {
        MakeCheckbox(wrapper.append("p").append("span"), "Include Equal", include_equal, function(value) {
            include_equal = value;
        });
    }

    wrapper.append("h3").text("Series");
    var ul = wrapper.append("ul");
    ul.classed("checkboxes", true);
    var li = ul.selectAll("li").data(info.serieses);
    var li_enter = li.enter().append("li").classed("btn-toggle", true);
    li_enter.append("span").classed("checkbox", true).append("span");
    li_enter.append("span").classed("name", true);
    li_enter.style("line-height", "20px");
    li.select(".name").text(function(d) { return " " + d; });
    var update_checked = function() {
        li.select("span.checkbox").select("span").attr("class", function(d) {
            return selected_serieses.has(d) ? "chartaccent-icons-checkbox-correct-checked" : "chartaccent-icons-checkbox-correct-empty";
        });
        li.classed("active", function(d) { return selected_serieses.has(d); });
    };
    li.on("click", function(d) {
        if(selected_serieses.has(d)) selected_serieses.delete(d);
        else selected_serieses.add(d);
        update_checked();
    });
    update_checked();

    var footer = wrapper.append("footer").append("span").style("float", "right");
    var btn_ok = footer.append("span").classed("btn", true).text("OK");
    footer.append("span").text(" ");
    var btn_cancel = footer.append("span").classed("btn", true).text("Cancel");

    btn_ok.on("click", function() {
        Events.raise(self, "selected", include_equal ? selected_mode + "-or-equal" : selected_mode, Array.from(selected_serieses));
        info.remove();
    });

    btn_cancel.on("click", function() {
        info.remove();
    });

    // wrapper.classed("select", true);
    // var ps = wrapper.append("ul").selectAll("li").data(info.choices);
    // var li = ps.enter().append("li")
    // li.append("span").call(IconFont.addIcon("correct")).classed("mark", true);
    // li.append("label")
    //     .text(function(d) { return d.name; })
    //     .style({
    //         "font-family": function(d) { return d.font ? d.font : null; }
    //     });
    // ps.classed("active", function(d) { return value == d.value; });
    // ps.on("click", function(d) {
    //     Events.raise(self, "value", d.value);
    //     info.remove();
    // });
};



var Annotation = function(info) {
    this.target = info.target;
    this.target_inherit = info.target_inherit;
    this.components = info.components;

    if(this.components === undefined) this.components = [];
    for(var i = 0; i < this.components.length; i++) {
        var component = this.components[i];
        if(component.visible === undefined) component.visible = true;
    }
    this.visible = info.visible;
    if(this.visible === undefined) this.visible = true;

    // Ugly stuff 1: If trendline-able, then add a trendline element.
    if((this.target.type == "items") || (this.target.type == "range" && this.target_inherit)) {
        this.components.push({
            visible: false,
            type: "trendline",
            style: Styles.createDefault("trendline")
        });
    }
    // Ugly stuff 2: If there is a highlight, add a highlight-line before it.
    var self = this;
    var index_to_highlight = null;
    this.components.forEach(function(d, i) {
        if(d.type == "highlight") {
            index_to_highlight = i;
        }
    });
    if(index_to_highlight !== null) {
        if(self.target.type == "items") {
            var should_add_highlight_line = self.target.items.some(function(d) { return d.elements.has_line; });
        }
        if(should_add_highlight_line) {
            self.components.splice(index_to_highlight, 0, {
                type: "highlight-line",
                style: this.components[index_to_highlight].style,
                visible: true
            });
        }
    }
};

var MakeFGPath = function(RC2, owner, fgpathclass, mode, x1, y1, x2, y2, draggable, mousemove, click) {
    var fgpath = RC2.addElement("fg", "path", fgpathclass + getObjectUniqueID(owner));
    fgpath.attr("d", Geometry.Path.rect(x1, y1, x2 - x1, y2 - y1));
    if(x1 == x2 || y1 == y2) {
        fgpath.classed("chartaccent-draghandle-line", true);
    }
    fgpath.classed("chartaccent-draghandle-range", true);
    fgpath.style({
        "stroke": "none",
        "fill": "none",
        "stroke-width": 5,
        "stroke-linejoin": "round",
        "pointer-events": "all",
        "cursor": draggable ? (fgpathclass == "vr" ? "move": (mode == "x" ? "ew-resize" : "ns-resize")) : "pointer"
    });
    if(x1 == x2 || y1 == y2) {
        fgpath.on("mousedown", function() {
            var px0 = d3.event.pageX;
            var py0 = d3.event.pageY;
            var mouse_moved = false;
            click();
            setupDragHandlers({
                mousemove: function() {
                    var px1 = d3.event.pageX;
                    var py1 = d3.event.pageY;
                    mouse_moved = true;
                    mousemove(px1 - px0, py1 - py0);
                },
                mouseup: function() {
                    click();
                    // if(!mouse_moved) {
                    //     if(click) click();
                    // }
                }
            });
        });
    } else {
        fgpath.style("pointer-events", "none");
        RC2.RC.addBubbleCursorItems(fgpath, { cursor: "move", layer: -1 }, function() {
            var px0 = d3.event.pageX;
            var py0 = d3.event.pageY;
            var mouse_moved = false;
            click();
            setupDragHandlers({
                mousemove: function() {
                    var px1 = d3.event.pageX;
                    var py1 = d3.event.pageY;
                    mouse_moved = true;
                    mousemove(px1 - px0, py1 - py0);
                },
                mouseup: function() {
                    click();
                    // if(!mouse_moved) {
                    //     if(click) click();
                    // }
                }
            });
        });
    }
};

Annotation.prototype.renderComponentRange = function(RC, RC2, component) {
    var doStartPopout = function() {
        RC2.startPopoutEditor();
    }
    if(this.target.type == "range") {
        if(RC2.axis && RC2.range_rect) {
            var range = RC2.range;
            var axis = RC2.axis;
            var range_rect = RC2.range_rect;
            var width = range_rect.x2 - range_rect.x1;
            var height = range_rect.y2 - range_rect.y1;
            if(width == 0 || height == 0) {
                var path = RC2.addElement("fg", "path", getObjectUniqueID(component));
            } else {
                var path = RC2.addElement("bg", "path", getObjectUniqueID(component));
                var path2 = RC2.addElement("fg", "path", getObjectUniqueID(component) + "_lines");
            }
            path.attr("d", Geometry.Path.rect(
                range_rect.x1, range_rect.y1,
                width, height
            ));
            if(path2) {
                if(RC2.axis.mode == "y") {
                    path2.attr("d", Geometry.Path.commands(
                        [ "M", range_rect.x1, range_rect.y1 ],
                        [ "L", range_rect.x2, range_rect.y1 ],
                        [ "M", range_rect.x1, range_rect.y2 ],
                        [ "L", range_rect.x2, range_rect.y2 ]
                    ));
                } else {
                    path2.attr("d", Geometry.Path.commands(
                        [ "M", range_rect.x1, range_rect.y1 ],
                        [ "L", range_rect.x1, range_rect.y2 ],
                        [ "M", range_rect.x2, range_rect.y1 ],
                        [ "L", range_rect.x2, range_rect.y2 ]
                    ));
                }
            }
            if(component.mode == "line" && !Scales.isScaleNumerical(RC2.axis.getScale())) {
                path.remove();
                var scale = RC2.axis.getScale();
                var i0 = scale.domain().indexOf(range[0]);
                var i1 = scale.domain().indexOf(range[1]);
                var commands = [];
                for(var i = i0; i <= i1; i++) {
                    var vrange = scale(scale.domain()[i]) + scale.rangeBand() / 2.0;
                    if(RC2.axis.mode == "x") {
                        var extent = Scales.getScaleRangeExtent(RC.owner.cartesian_scales.y);
                        commands.push([ "M", vrange, extent[0] ]);
                        commands.push([ "L", vrange, extent[1] ]);
                    } else {
                        var extent = Scales.getScaleRangeExtent(RC.owner.cartesian_scales.x);
                        commands.push([ "M", extent[0], vrange ]);
                        commands.push([ "L", extent[1], vrange ]);
                    }
                }
                path2.attr("d", Geometry.Path.commands.apply(null, commands));
            }

            var color = component.color ? Expression.safeEval(component.color, RC2.context) : Colors.default_color;
            if(width == 0 || height == 0) {
                path.style({
                    "fill": "none",
                    "stroke": component.style.stroke !== null ? component.style.stroke : "none",
                    "stroke-width": component.style.stroke_width
                });
            } else {
                path.style({
                    "fill": component.style.fill !== null ? component.style.fill : "none",
                    "stroke": "none"
                });
                path2.style({
                    "fill": "none",
                    "stroke": component.style.stroke !== null ? component.style.stroke : "none",
                    "stroke-width": component.style.stroke_width
                });
            }

            if(component.visible && this.visible) {
                path.style("visibility", "visible");
                if(path2) path2.style("visibility", "visible");
            } else {
                path.style("visibility", "hidden");
                if(path2) path2.style("visibility", "hidden");
            }

            if(RC.isEditing) {
                // Differentiate x and y axis.
                if(RC2.axis.mode == "x") {
                    var processValue = function(dx, dy, v0) {
                        return Scales.getScaleInverseClampSnap(axis.chart.cartesian_scales.x, Scales.getScale(axis.chart.cartesian_scales.x, v0) + dx, v0);
                    };
                    var x1_r = range_rect.x1; var x1_0 = range_rect.x1; var x1_1 = range_rect.x2;
                    var y1_r = range_rect.y1; var y1_0 = range_rect.y1; var y1_1 = range_rect.y1;
                    var x2_r = range_rect.x2; var x2_0 = range_rect.x1; var x2_1 = range_rect.x2;
                    var y2_r = range_rect.y2; var y2_0 = range_rect.y2; var y2_1 = range_rect.y2;
                }
                if(RC2.axis.mode == "y") {
                    var processValue = function(dx, dy, v0) {
                        return Scales.getScaleInverseClampSnap(axis.chart.cartesian_scales.y, Scales.getScale(axis.chart.cartesian_scales.y, v0) + dy, v0);
                    };
                    var x1_r = range_rect.x1; var x1_0 = range_rect.x1; var x1_1 = range_rect.x1;
                    var y1_r = range_rect.y1; var y1_0 = range_rect.y1; var y1_1 = range_rect.y2;
                    var x2_r = range_rect.x2; var x2_0 = range_rect.x2; var x2_1 = range_rect.x2;
                    var y2_r = range_rect.y2; var y2_0 = range_rect.y1; var y2_1 = range_rect.y2;
                }
                // Render move handlers.
                if(Expression.isSimpleFunction(this.target.range, "range")) {
                    var v0 = Expression.isValue(this.target.range.args[0]) ? this.target.range.args[0].value : undefined;
                    var v1 = Expression.isValue(this.target.range.args[1]) ? this.target.range.args[1].value : undefined;
                    var expr0 = this.target.range.args[0];
                    var expr1 = this.target.range.args[1];

                    MakeFGPath(RC2, this, "vr", axis.mode, x1_r, y1_r, x2_r, y2_r, (v0 !== undefined || v1 !== undefined), function(dx, dy) {
                        if(v0 !== undefined) {
                            expr0.value = processValue(dx, dy, v0);
                        }
                        if(v1 !== undefined) {
                            expr1.value = processValue(dx, dy, v1);
                        }
                        if(expr0.eval(RC2.context) < expr1.eval(RC2.context)) {
                            this.target.range.args[0] = expr0;
                            this.target.range.args[1] = expr1;
                        } else {
                            this.target.range.args[0] = expr1;
                            this.target.range.args[1] = expr0;
                        }
                        DM.invalidate(this);
                        RC.validate();
                    }.bind(this), doStartPopout);
                    MakeFGPath(RC2, this, "v0", axis.mode, x1_0, y1_0, x2_0, y2_0, v0 !== undefined, function(dx, dy) {
                        if(v0 !== undefined) {
                            expr0.value = processValue(dx, dy, v0);
                            if(expr0.eval(RC2.context) < expr1.eval(RC2.context)) {
                                this.target.range.args[0] = expr0;
                                this.target.range.args[1] = expr1;
                            } else {
                                this.target.range.args[0] = expr1;
                                this.target.range.args[1] = expr0;
                            }
                            DM.invalidate(this);
                        }
                        RC.validate();
                    }.bind(this), doStartPopout);
                    MakeFGPath(RC2, this, "v1", axis.mode, x1_1, y1_1, x2_1, y2_1, v1 !== undefined, function(dx, dy) {
                        if(v1 !== undefined) {
                            expr1.value = processValue(dx, dy, v1);
                            if(expr0.eval(RC2.context) < expr1.eval(RC2.context)) {
                                this.target.range.args[0] = expr0;
                                this.target.range.args[1] = expr1;
                            } else {
                                this.target.range.args[0] = expr1;
                                this.target.range.args[1] = expr0;
                            }
                            DM.invalidate(this);
                        }
                        RC.validate();
                    }.bind(this), doStartPopout);
                } else {
                    if(Expression.isValue(this.target.range)) {
                        var v0 = this.target.range.value, y0 = axis.chart.cartesian_scales.y(v0);
                        MakeFGPath(RC2, this, "v0", axis.mode, x1_r, y1_r, x2_r, y2_r, true, function(dx, dy) {
                            this.target.range.value = processValue(dx, dy, v0);
                            DM.invalidate(this);
                            RC.validate();
                        }.bind(this), doStartPopout);
                    } else {
                        MakeFGPath(RC2, this, "v0", axis.mode, x1_r, y1_r, x2_r, y2_r, false, null, doStartPopout);
                    }
                }
                // Render range tabs.
                var handle_tab_button = function(d, button, button_element) {
                    if(button == "more") {
                        doStartPopout();
                    }
                    if(button == "eye") {
                        this.visible = !this.visible;
                        // this.components.forEach(function(d) {
                        //     if(d.type == "label") d.visible = component.visible;
                        // });
                        DM.invalidate(this);
                        RC.validate();
                    }
                    if(button == "bars") {
                        if(RC.owner.annotations.some(function(d) { return d.target == this.target && d != this; }.bind(this))) {
                            var is_something_selected = RC.owner.annotations.some(function(d) {
                                if(d.target == this.target && d != this) {
                                    if(d.visible) return true;
                                } else {
                                    return false;
                                }
                            }.bind(this));
                            if(is_something_selected) {
                                RC.owner.annotations.forEach(function(d) {
                                    if(d.target == this.target && d != this) {
                                        d.visible = false;
                                        DM.invalidate(d);
                                    }
                                }.bind(this));
                            } else {
                                RC.owner.annotations.forEach(function(d) {
                                    if(d.target == this.target && d != this) {
                                        d.visible = true;
                                        DM.invalidate(d);
                                    }
                                }.bind(this));
                            }
                        } else {
                            this.startSelectRangeItems(RC, d3.select(button_element), null);
                        }
                        // var highlights = this.components.filter(function(d) { return d.type == "highlight"; });
                        // if(highlights.every(function(d) { return d.visible; })) {
                        //     highlights.forEach(function(d) { d.visible = false; });
                        // } else {
                        //     highlights.forEach(function(d) { d.visible = true; });
                        // }
                        // DM.invalidate(this);
                        RC.validate();
                    }
                }.bind(this);

                var buttons = [ "more" ];

                if(RC2.axis.mode == "y") {
                    var tabs = RC2.addElement("fg2", "g", getObjectUniqueID(component));
                    tabs.classed("chartaccent-edit-widget", true);
                    tabs.attr("transform", "translate(" + range_rect.x2 + ",0)");
                    tabs.call(Widgets.RangeTab({
                        orientation: "vertical",
                        t1: function() { return range_rect.y1 },
                        t2: function() { return range_rect.y2 },
                        buttons: buttons,
                        buttonActive: function(d, button) {
                            if(button == "eye") {
                                return this.visible;
                            }
                            if(button == "bars") {
                                return RC.owner.annotations.some(function(d) {
                                    if(d.target == this.target && d != this) {
                                        if(d.visible) return true;
                                    } else {
                                        return false;
                                    }
                                }.bind(this));
                            }
                        }.bind(this),
                        onClick: handle_tab_button
                    }));
                }
                if(RC2.axis.mode == "x") {
                    var tabs = RC2.addElement("fg2", "g", getObjectUniqueID(component));
                    tabs.attr("transform", "translate(0, " + range_rect.y2 + ")");
                    tabs.classed("chartaccent-edit-widget", true);
                    tabs.call(Widgets.RangeTab({
                        orientation: "horizontal",
                        t1: function() { return range_rect.x1 },
                        t2: function() { return range_rect.x2 },
                        buttons: buttons,
                        buttonActive: function(d, button) {
                            if(button == "eye") {
                                return this.visible;
                            }
                            if(button == "bars") {
                                var highlights = this.components.filter(function(d) { return d.type == "highlight"; });
                                return highlights.every(function(d) { return d.visible; });
                            }
                        }.bind(this),
                        onClick: handle_tab_button
                    }));
                }
                tabs.classed("edit-widget", true);
            }
        }
    }
};

Annotation.prototype.renderComponentLabel = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;
    var annotation = this;
    var text = Expression.safeEvalAsString(component.text, RC2.context);
    var anchor = component.anchor;
    var extent = RC2.extent;

    var doStartPopout = function() {
        RC2.startPopoutEditor();
    }

    if(component.line) {
        var label_line = RC2.addElement("fg2", "path", undefined, getObjectUniqueID(component));
    }

    var label = RC2.addElement("fg2", "text", undefined, getObjectUniqueID(component));
    label.text(text);
    label.call(function() { Styles.applyStyle(component.style, this); })
    label.style({
        "font-family": component.style.font_family,
        "font-size": component.style.font_size,
        "paint-order": "stroke",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "cursor": "move",
        "pointer-events": "all"
    });

    if(extent) {
        if(extent.type == "polyline") {
            var x1 = d3.min(extent.polyline.points, function(d) { return d.x; });
            var x2 = d3.max(extent.polyline.points, function(d) { return d.x; });
            var y1 = d3.min(extent.polyline.points, function(d) { return d.y; });
            var y2 = d3.max(extent.polyline.points, function(d) { return d.y; });
            extent = {
                type: "rect",
                rect: {
                    x1: x1, y1: y1,
                    x2: x2, y2: y2
                }
            }
        }
        if(extent.type == "rect") {
            var align = component.anchor ? component.anchor.split(",") : ["m", "m"]
            var align_x = align[0];
            var align_y = align[1];

            var margin = 3;

            var dx = 0;
            var dy = 0;
            if(component.anchor_offset) {
                dx = component.anchor_offset.x;
                dy = component.anchor_offset.y;
            }

            var anchor_x = 0, anchor_y = 0;

            if(align_x == "rr") {
                anchor_x = Math.max(extent.rect.x1, extent.rect.x2)
                label.attr("x", dx + Math.max(extent.rect.x1, extent.rect.x2) + margin);
                label.style("text-anchor", "start");
            }
            if(align_x == "r") {
                anchor_x = Math.max(extent.rect.x1, extent.rect.x2)
                label.attr("x", dx + Math.max(extent.rect.x1, extent.rect.x2) - margin);
                label.style("text-anchor", "end");
            }
            if(align_x == "m") {
                anchor_x = (extent.rect.x1 + extent.rect.x2) / 2;
                label.attr("x", dx + (extent.rect.x1 + extent.rect.x2) / 2);
                label.style("text-anchor", "middle");
            }
            if(align_x == "l") {
                anchor_x = Math.min(extent.rect.x1, extent.rect.x2);
                label.attr("x", dx + Math.min(extent.rect.x1, extent.rect.x2) + margin);
                label.style("text-anchor", "start");
            }
            if(align_x == "ll") {
                anchor_x = Math.min(extent.rect.x1, extent.rect.x2);
                label.attr("x", dx + Math.min(extent.rect.x1, extent.rect.x2) - margin);
                label.style("text-anchor", "end");
            }
            if(align_y == "bb") {
                anchor_y = Math.max(extent.rect.y1, extent.rect.y2);
                label.attr("y", dy + Math.max(extent.rect.y1, extent.rect.y2) + margin);
                label.style("dominant-baseline", "text-before-edge");
            }
            if(align_y == "b") {
                anchor_y = Math.max(extent.rect.y1, extent.rect.y2);
                label.attr("y", dy + Math.max(extent.rect.y1, extent.rect.y2) - margin);
                label.style("dominant-baseline", "text-after-edge");
            }
            if(align_y == "m") {
                anchor_y = (extent.rect.y1 + extent.rect.y2) / 2;
                label.attr("y", dy + (extent.rect.y1 + extent.rect.y2) / 2);
                label.style("dominant-baseline", "middle");
            }
            if(align_y == "t") {
                anchor_y = Math.min(extent.rect.y1, extent.rect.y2);
                label.attr("y", dy + Math.min(extent.rect.y1, extent.rect.y2) + margin);
                label.style("dominant-baseline", "text-before-edge");
            }
            if(align_y == "tt") {
                anchor_y = Math.min(extent.rect.y1, extent.rect.y2);
                label.attr("y", dy + Math.min(extent.rect.y1, extent.rect.y2) - margin);
                label.style("dominant-baseline", "text-after-edge");
            }
        }
    } else {
        console.log("TODO: Unable to draw label without extent.");
        label.remove();
        // TODO...
    }

    if(label_line) {
        var commands = [];
        var bbox = label.node().getBBox();
        var y_line = bbox.y + bbox.height;
        if(anchor_y < bbox.y) {
            y_line = bbox.y;
        }
        commands.push(["M", anchor_x, anchor_y]);
        commands.push(["L", Math.max(bbox.x, Math.min(bbox.x + bbox.width, anchor_x)), y_line]);
        commands.push(["M", bbox.x, y_line]);
        commands.push(["L", bbox.x + bbox.width, y_line]);
        // console.log(points);
        label_line.attr("d", Geometry.Path.commands.apply(null, commands));
        label_line.style({
            "fill": "none",
            "stroke": component.style.fill,
            "stroke-linejoin": "round"
        });
    }


    if(RC.isEditing) {
        if(true) {
            label.on("mousedown", function() {
                doStartPopout();

                var is_moved = false;
                var x0 = d3.event.pageX;
                var y0 = d3.event.pageY;
                var dx0 = 0;
                var dy0 = 0;
                if(component.anchor_offset) {
                    dx0 = component.anchor_offset.x;
                    dy0 = component.anchor_offset.y;
                }
                if(annotation.target.type == "freeform" && annotation.target.point) {
                    var target_x0 = annotation.target.point.x;
                    var target_y0 = annotation.target.point.y;
                }
                setupDragHandlers({
                    mousemove: function() {
                        is_moved = true;
                        var mdx = d3.event.pageX - x0;
                        var mdy = d3.event.pageY - y0;
                        if(annotation.target.type == "freeform" && annotation.target.point && !component.line) {
                            annotation.target.point.x = target_x0 + mdx;
                            annotation.target.point.y = target_y0 + mdy;
                        } else {
                            component.anchor_offset = {
                                x: dx0 + mdx,
                                y: dy0 + mdy
                            };
                        }
                        DM.invalidate(annotation);
                        RC.validate();
                    },
                    mouseup: function() {
                        if(!is_moved) {
                            setupEasyExpressionEditor({
                                anchor: label.node(),
                                expression: component.text,
                                is_string_expression: true,
                                change: function(expr) {
                                    component.text = expr;
                                    DM.invalidate(annotation);
                                    RC.validate();
                                }
                            });
                        }
                        doStartPopout();
                    }
                });
            });
        }
        if(component._show_expression_editor) {
            delete component._show_expression_editor;
            setupEasyExpressionEditor({
                anchor: label.node(),
                expression: component.text,
                is_string_expression: true,
                change: function(expr) {
                    component.text = expr;
                    DM.invalidate(annotation);
                    RC.validate();
                }
            });
        }
    }
};

Annotation.prototype.forEachElementsItem = function(RC, callback) {
    var annotation = this;
    if(annotation.target.type == "items") {
        annotation.target.items.forEach(function(desc) {
            var elements = desc.elements;
            desc.items.forEach(function(item) {
                callback(elements, item);
            });
        });
    }
    if(annotation.target.type == "range") {
        if(annotation.target_inherit) {
            annotation.target_inherit.serieses.forEach(function(elements) {
                if(!elements.getRangeItems) return;
                var items = elements.getRangeItems(annotation.target.range.eval(RC.context), annotation.target.axis, annotation.target_inherit.mode);
                items.forEach(function(item) {
                    callback(elements, item);
                });
            });
        }
    }
    if(annotation.target.type == "serieses") {
        annotation.target.serieses.forEach(function(elements) {
            if(!elements.getItems) return;
            elements.getItems().forEach(function(item) {
                callback(elements, item);
            });
        });
    }
};

Annotation.prototype.renderComponentItemLabel = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;

    var annotation = this;

    var doStartPopout = function() {
        RC2.startPopoutEditor();
    }

    annotation.forEachElementsItem(RC, function(elements, item) {
        var context_object = { };
        for(var key in item) {
            if(item.hasOwnProperty(key)) {
                context_object[key] = item[key];
            }
        }
        if(elements.getValue) {
            context_object['value'] = elements.getValue(item);
        }
        var context = Expression.CreateContext(context_object, RC2.context);
        var text = Expression.safeEvalAsString(component.text, context);
        var anchor = component.anchor;
        var label_id = getObjectUniqueID(elements) + getObjectUniqueID(item);
        var extent = elements.getItemExtent(item);

        if(component.line) {
            var label_line = RC2.addElement("fg2", "path", undefined, label_id);
        }

        var label = RC2.addElement("fg2", "text", undefined, label_id);
        label.text(text);
        label.call(function() { Styles.applyStyle(component.style, this); })
        label.style({
            "font-family": component.style.font_family,
            "font-size": component.style.font_size,
            "paint-order": "stroke",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "cursor": "move",
            "pointer-events": "all"
        });

        if(extent) {
            if(extent.type == "polyline") {
                var x1 = d3.min(extent.polyline.points, function(d) { return d.x; });
                var x2 = d3.max(extent.polyline.points, function(d) { return d.x; });
                var y1 = d3.min(extent.polyline.points, function(d) { return d.y; });
                var y2 = d3.max(extent.polyline.points, function(d) { return d.y; });
                extent = {
                    type: "rect",
                    rect: {
                        x1: x1, y1: y1,
                        x2: x2, y2: y2
                    }
                }
            }
            if(extent.type == "rect") {
                var align = component.anchor ? component.anchor.split(",") : ["m", "m"]
                var align_x = align[0];
                var align_y = align[1];

                var margin = 3;

                var dx = 0;
                var dy = 0;
                if(component.anchor_offset) {
                    dx = component.anchor_offset.x;
                    dy = component.anchor_offset.y;
                }

                var anchor_x = 0, anchor_y = 0;

                if(align_x == "rr") {
                    anchor_x = Math.max(extent.rect.x1, extent.rect.x2)
                    label.attr("x", dx + Math.max(extent.rect.x1, extent.rect.x2) + margin);
                    label.style("text-anchor", "start");
                }
                if(align_x == "r") {
                    anchor_x = Math.max(extent.rect.x1, extent.rect.x2)
                    label.attr("x", dx + Math.max(extent.rect.x1, extent.rect.x2) - margin);
                    label.style("text-anchor", "end");
                }
                if(align_x == "m") {
                    anchor_x = (extent.rect.x1 + extent.rect.x2) / 2;
                    label.attr("x", dx + (extent.rect.x1 + extent.rect.x2) / 2);
                    label.style("text-anchor", "middle");
                }
                if(align_x == "l") {
                    anchor_x = Math.min(extent.rect.x1, extent.rect.x2);
                    label.attr("x", dx + Math.min(extent.rect.x1, extent.rect.x2) + margin);
                    label.style("text-anchor", "start");
                }
                if(align_x == "ll") {
                    anchor_x = Math.min(extent.rect.x1, extent.rect.x2);
                    label.attr("x", dx + Math.min(extent.rect.x1, extent.rect.x2) - margin);
                    label.style("text-anchor", "end");
                }
                if(align_y == "bb") {
                    anchor_y = Math.max(extent.rect.y1, extent.rect.y2);
                    label.attr("y", dy + Math.max(extent.rect.y1, extent.rect.y2) + margin);
                    label.style("dominant-baseline", "text-before-edge");
                }
                if(align_y == "b") {
                    anchor_y = Math.max(extent.rect.y1, extent.rect.y2);
                    label.attr("y", dy + Math.max(extent.rect.y1, extent.rect.y2) - margin);
                    label.style("dominant-baseline", "text-after-edge");
                }
                if(align_y == "m") {
                    anchor_y = (extent.rect.y1 + extent.rect.y2) / 2;
                    label.attr("y", dy + (extent.rect.y1 + extent.rect.y2) / 2);
                    label.style("dominant-baseline", "middle");
                }
                if(align_y == "t") {
                    anchor_y = Math.min(extent.rect.y1, extent.rect.y2);
                    label.attr("y", dy + Math.min(extent.rect.y1, extent.rect.y2) + margin);
                    label.style("dominant-baseline", "text-before-edge");
                }
                if(align_y == "tt") {
                    anchor_y = Math.min(extent.rect.y1, extent.rect.y2);
                    label.attr("y", dy + Math.min(extent.rect.y1, extent.rect.y2) - margin);
                    label.style("dominant-baseline", "text-after-edge");
                }
            }
        } else {
            console.log("TODO: Unable to draw label without extent.");
            label.remove();
            // TODO...
        }

        if(label_line) {
            var commands = [];
            var bbox = label.node().getBBox();
            var y_line = bbox.y + bbox.height;
            if(anchor_y < bbox.y) {
                y_line = bbox.y;
            }
            commands.push(["M", anchor_x, anchor_y]);
            commands.push(["L", Math.max(bbox.x, Math.min(bbox.x + bbox.width, anchor_x)), y_line]);
            commands.push(["M", bbox.x, y_line]);
            commands.push(["L", bbox.x + bbox.width, y_line]);
            // console.log(points);
            label_line.attr("d", Geometry.Path.commands.apply(null, commands));
            label_line.style({
                "fill": "none",
                "stroke": component.style.fill,
                "stroke-linejoin": "round"
            });
        }


        if(RC.isEditing) {
            label.on("mousedown", function() {
                doStartPopout();

                var is_moved = false;
                var x0 = d3.event.pageX;
                var y0 = d3.event.pageY;
                var dx0 = 0;
                var dy0 = 0;
                if(component.anchor_offset) {
                    dx0 = component.anchor_offset.x;
                    dy0 = component.anchor_offset.y;
                }
                setupDragHandlers({
                    mousemove: function() {
                        is_moved = true;
                        var mdx = d3.event.pageX - x0;
                        var mdy = d3.event.pageY - y0;
                        component.anchor_offset = {
                            x: dx0 + mdx,
                            y: dy0 + mdy
                        };
                        DM.invalidate(annotation);
                        RC.validate();
                    },
                    mouseup: function() {
                        if(!is_moved) {
                            setupEasyExpressionEditor({
                                anchor: label.node(),
                                expression: component.text,
                                is_string_expression: true,
                                change: function(expr) {
                                    component.text = expr;
                                    DM.invalidate(annotation);
                                    RC.validate();
                                }
                            });
                        }
                        doStartPopout();
                    }
                });
            });
        }
    });
};

Annotation.prototype.renderComponentHighlight = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;
    if(this.target.type == "items") {
        this.target.items.forEach(function(desc) {
            var elements = desc.elements;
            var items = desc.items;
            var g = RC2.addElement("fg", "g", "highlight", getObjectUniqueID(desc) + getObjectUniqueID(component) + getObjectUniqueID(elements));
            var overlay = elements.createHighlightOverlay(g, items, component.style);
            // if(RC.hasSelection() || RC.isSelected(RC2.annotation)) {
            //     overlay.style("pointer-events", "none");
            // }
            if(RC.isSelectionInAnnotation(RC2.annotation)) {
                overlay.style("pointer-events", "none");
            }
            // overlay.call(function() { Styles.applyStyle(component.style, this); });
            if(overlay) {
                overlay.style({
                    "cursor": "pointer"
                });
                overlay.on("mousedown", function() {
                    RC2.startPopoutEditor();
                });
                overlay.on("mouseover", function() {
                    if(!RC.isSelectionInAnnotation(RC2.annotation)) {
                        if(d3.event.which == 0) {
                            RC2.annotation.renderSelectionBoxHint(RC);
                        }
                    }
                });
                overlay.on("mouseleave", function() {
                    RC2.annotation.removeSelectionBoxHint(RC);
                });
            } else {
                g.remove();
            }
        });
    }
    if(this.target.type == "range") {
        // Find all items in this range.
        this.target_inherit.serieses.forEach(function(elements) {
            if(elements.createRangeHighlightOverlay) {
                var g = RC2.addElement("fg", "g", "highlight", getObjectUniqueID(elements) + getObjectUniqueID(component));
                var overlay = elements.createRangeHighlightOverlay(g, RC2.range, RC2.axis, this.target_inherit.mode, component.style);
                if(RC.isSelectionInAnnotation(RC2.annotation)) {
                    overlay.style("pointer-events", "none");
                }
                // overlay.call(function() { Styles.applyStyle(component.style, this); });
                if(overlay) {
                    overlay.style({
                        "cursor": "pointer"
                    });
                    overlay.on("mousedown", function() {
                        RC2.startPopoutEditor();
                    });
                    overlay.on("mouseover", function() {
                        if(!RC.isSelectionInAnnotation(RC2.annotation)) {
                            if(d3.event.which == 0) {
                                RC2.annotation.renderSelectionBoxHint(RC);
                            }
                        }
                    });
                    overlay.on("mouseleave", function() {
                        RC2.annotation.removeSelectionBoxHint(RC);
                    });
                } else {
                    g.remove();
                }
            }
        }.bind(this));
    }
};

Annotation.prototype.renderComponentHighlightLine = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;
    if(this.target.type == "items") {
        this.target.items.forEach(function(desc) {
            var elements = desc.elements;
            var items = desc.items;
            var g = RC2.addElement("fg", "g", "highlight", getObjectUniqueID(desc) + getObjectUniqueID(component) + getObjectUniqueID(elements));
            var overlay = elements.createLineHighlightOverlay(g, items, component.style);
            // overlay.call(function() { Styles.applyStyle(component.style, this); });
            if(overlay) {
                overlay.style({
                    "cursor": "pointer"
                });
                overlay.on("mousedown", function() {
                    RC2.startPopoutEditor();
                });
            } else {
                g.remove();
            }
        });
    }
    if(this.target.type == "range") {
        // Find all items in this range.
        this.target_inherit.serieses.forEach(function(elements) {
            if(elements.createRangeHighlightOverlay) {
                var g = RC2.addElement("fg", "g", "highlight", getObjectUniqueID(elements) + getObjectUniqueID(component));
                var overlay = elements.createRangeLineHighlightOverlay(g, RC2.range, RC2.axis, this.target_inherit.mode, component.style);
                // overlay.call(function() { Styles.applyStyle(component.style, this); });
                if(overlay) {
                    overlay.style({
                        "cursor": "pointer"
                    });
                    overlay.on("mousedown", function() {
                        RC2.startPopoutEditor();
                    });
                } else {
                    g.remove();
                }
            }
        }.bind(this));
    }
};

Annotation.prototype.renderComponentTrendline = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;

    var annotation = this;

    var doStartPopout = function() {
        RC2.startPopoutEditor();
    }

    // Compute the trend line.
    var points = [];
    if(annotation.target.type == "items") {
        annotation.target.items.forEach(function(desc) {
            desc.items.forEach(function(d) {
                var x = desc.elements.getAxisValue(d, "x");
                var y = desc.elements.getAxisValue(d, "y");
                var px = Scales.getScaleValueRange(RC.owner.cartesian_scales.x, x);
                var py = Scales.getScaleValueRange(RC.owner.cartesian_scales.y, y);
                px = (px[0] + px[1]) / 2;
                py = (py[0] + py[1]) / 2;
                points.push([px, py,
                    Scales.getScaleValueRange(RC.owner.cartesian_scales.x, x),
                    Scales.getScaleValueRange(RC.owner.cartesian_scales.y, y)
                ]);
            });
        });
    }
    if(annotation.target.type == "range") {
        annotation.target_inherit.serieses.forEach(function(elements) {
            if(!elements.getRangeItems) return;
            var items = elements.getRangeItems(RC2.range, RC2.axis, annotation.target_inherit.mode);
            items.forEach(function(item) {
                var x = elements.getAxisValue(item, "x");
                var y = elements.getAxisValue(item, "y");
                var px = Scales.getScaleValueRange(RC.owner.cartesian_scales.x, x);
                var py = Scales.getScaleValueRange(RC.owner.cartesian_scales.y, y);
                px = (px[0] + px[1]) / 2;
                py = (py[0] + py[1]) / 2;
                points.push([px, py,
                    Scales.getScaleValueRange(RC.owner.cartesian_scales.x, x),
                    Scales.getScaleValueRange(RC.owner.cartesian_scales.y, y)
                ]);
            });
        });
    }
    // We need at least 3 points to do the regression.
    if(points.length <= 1) return;

    // Compute linear regression with least squares.
    // y = Mx + C
    var xsum = 0, ysum = 0, xysum = 0, xxsum = 0, yysum = 0, n = points.length;
    for(var i = 0; i < points.length; i++) {
        xsum += points[i][0];
        ysum += points[i][1];
        xxsum += points[i][0] * points[i][0];
        yysum += points[i][1] * points[i][1];
        xysum += points[i][0] * points[i][1];
    }
    // The slope.
    var M = (n * xysum - xsum * ysum) / (n * xxsum - xsum * xsum);
    // The intercept.
    var C = ysum / n - M * xsum / n;

    var line = RC2.addElement("fg", "line", "trendline", getObjectUniqueID(component));
    var line_handle = RC2.addElement("fg", "line", "trendline-handle", getObjectUniqueID(component));
    var xExtent = [
        d3.min(points, function(d) { return Math.min(d[2][0], d[2][1]); }),
        d3.max(points, function(d) { return Math.max(d[2][0], d[2][1]); })
    ];
    var yExtent = Scales.getScaleRangeExtent(RC.owner.cartesian_scales.y);
    var x1 = Math.min(xExtent[0], xExtent[1]);
    var x2 = Math.max(xExtent[0], xExtent[1]);
    // Clip to yExtent.
    if(M * x1 + C > Math.max(yExtent[0], yExtent[1])) {
        x1 = (Math.max(yExtent[0], yExtent[1]) - C) / M;
    }
    if(M * x1 + C < Math.min(yExtent[0], yExtent[1])) {
        x1 = (Math.min(yExtent[0], yExtent[1]) - C) / M;
    }
    if(M * x2 + C > Math.max(yExtent[0], yExtent[1])) {
        x2 = (Math.max(yExtent[0], yExtent[1]) - C) / M;
    }
    if(M * x2 + C < Math.min(yExtent[0], yExtent[1])) {
        x2 = (Math.min(yExtent[0], yExtent[1]) - C) / M;
    }
    line.attr({
        "x1": x1,
        "y1": M * x1 + C,
        "x2": x2,
        "y2": M * x2 + C
    });
    line_handle.attr({
        "x1": x1,
        "y1": M * x1 + C,
        "x2": x2,
        "y2": M * x2 + C
    });
    line.style({
        "fill": "none",
        "stroke": component.style.stroke !== null ? component.style.stroke : "none",
        "stroke-width": component.style.stroke_width,
        "stroke-linecap": "round",
        "pointer-events": "none"
    });
    line_handle.style({
        "cursor": "pointer",
        "stroke-linecap": "round",
        "stroke-width": 5,
        "pointer-events": "all"
    });
    line_handle.classed("chartaccent-draghandle-line", true);
    line_handle.on("mousedown", function() {
        RC2.startPopoutEditor();
    });
};

function CreateBubbleSet(g, defs, color, sigma) {
    if(sigma === undefined) sigma = 10;

    var o = { };
    var filter_id = "chartaccent-item-background-filter-" + getObjectUniqueID(o);
    var filter = defs.append("filter")
        .attr("id", filter_id);
    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", sigma);

    var gaussian_max = 1.0;
    var threshold = 0.1;
    var slope = 50;

    var tr = filter.append("feComponentTransfer");
    tr.append("feFuncA").attr("type", "linear").attr("intercept", -threshold * slope + 0.5).attr("slope", slope / gaussian_max);

    var tr = filter.append("feComponentTransfer");
    tr.append("feFuncR").attr("type", "linear").attr("intercept", color.r / 255.0).attr("slope", 0);
    tr.append("feFuncG").attr("type", "linear").attr("intercept", color.g / 255.0).attr("slope", 0);
    tr.append("feFuncB").attr("type", "linear").attr("intercept", color.b / 255.0).attr("slope", 0);
    tr.append("feFuncA").attr("type", "table").attr("tableValues", "0 " + color.a);


    var bbox = g.node().getBBox();
    filter.attr("filterUnits", "userSpaceOnUse");
    var margin = 40;
    filter.attr("x", bbox.x - margin);
    filter.attr("y", bbox.y - margin);
    filter.attr("width", bbox.width + margin * 2);
    filter.attr("height", bbox.height + margin * 2);

    g.style("filter", "url(#" + filter_id + ")");

    var nodes = [];
    g.selectAll(":not(g)").each(function(d) {
        var bbox = this.getBBox();
        var x = bbox.x + bbox.width / 2;
        var y = bbox.y + bbox.height / 2;
        nodes.push(new Geometry.Vector(x, y));
    });
    var mst = Geometry.minimalSpanningTree(nodes);
    g.append("g").selectAll("line").data(mst).enter().append("line")
        .attr("x1", function(d) { return nodes[d[0]].x; })
        .attr("y1", function(d) { return nodes[d[0]].y; })
        .attr("x2", function(d) { return nodes[d[1]].x; })
        .attr("y2", function(d) { return nodes[d[1]].y; })
        .style({
            "stroke": "black",
            "stroke-width": 3,
            "stroke-linecap": "round"
        });
};

Annotation.prototype.renderComponentBubbleset = function(RC, RC2, component) {
    if(!component.visible || !this.visible || !component.style.fill) return;

    var defs = RC2.addElement("fg", "defs", getObjectUniqueID(component));
    defs.selectAll("*").remove();

    var g_items = RC2.addElement("bg", "g", "highlight", "bg-" + getObjectUniqueID(component));
    g_items.selectAll("*").remove();


    if(this.target.type == "items") {
        this.target.items.forEach(function(desc) {
            var elements = desc.elements;
            var items = desc.items;
            var g = g_items.append("g");
            var overlay = elements.createHighlightOverlay(g, items, Styles.createDefault("black"));
            overlay.style({
                "cursor": "pointer",
                "pointer-events": "all"
            });
            overlay.on("click", function() {
                RC2.startPopoutEditor();
            });

        });
    }
    if(this.target.type == "range") {
        // Find all items in this range.
        this.target_inherit.serieses.forEach(function(elements) {
            if(elements.createRangeHighlightOverlay) {
                var g = g_items.append("g");
                var overlay = elements.createRangeHighlightOverlay(g, RC2.range, RC2.axis, this.target_inherit.mode);
                if(overlay) {
                    overlay.style({
                        "fill": "black",
                        "stroke": "black",
                        "strok-width": 3,
                        "cursor": "pointer",
                        "pointer-events": "all"
                    });
                    overlay.on("click", function() {
                        RC2.startPopoutEditor();
                    });
                } else {
                    g.remove();
                }
            }
        }.bind(this));
    }

    if(component.sigma === undefined) component.sigma = 10;
    CreateBubbleSet(g_items, defs, component.style.fill, component.sigma);
};

function MakeRectResizer(RC2, visible, uid, rect, onresize, onclick, is_back_layer) {
    var rect_bg = RC2.addElement("fg", "rect", "chartaccent-draghandle-range", uid + "-resize-bg");
    rect_bg.style({
        "stroke": "none",
        "fill": "none",
        "stroke-width": 5,
        "pointer-events": "none",
        "cursor": "move"
    });
    rect_bg.attr("x", Math.min(rect.x1, rect.x2));
    rect_bg.attr("y", Math.min(rect.y1, rect.y2));
    rect_bg.attr("width", Math.abs(rect.x1 - rect.x2));
    rect_bg.attr("height", Math.abs(rect.y1 - rect.y2));
    RC2.RC.addBubbleCursorItems(rect_bg, { cursor: "move", layer: is_back_layer ? -2 : 1 }, function() {
        onclick();
        var px0 = d3.event.pageX;
        var py0 = d3.event.pageY;
        setupDragHandlers({
            mousemove: function() {
                var px1 = d3.event.pageX;
                var py1 = d3.event.pageY;
                var dx = px1 - px0;
                var dy = py1 - py0;
                mouse_moved = true;
                onresize({
                    x1: rect.x1 + dx,
                    y1: rect.y1 + dy,
                    x2: rect.x2 + dx,
                    y2: rect.y2 + dy
                });
            },
            mouseup: function() {
                onclick();
            }
        });
    });

    var edges = [ [ [ 1, 1 ], [ 1, 2 ] ], [ [ 2, 2 ], [ 1, 2 ] ], [ [ 1, 2 ], [ 1, 1 ] ], [ [ 1, 2 ], [ 2, 2 ] ] ];
    var corners = [ [ 1, 1 ], [ 1, 2 ], [ 2, 1 ], [ 2, 2 ] ];
    var g_edges = RC2.addElement("fg", "g", undefined, uid + "-resize-edges");
    var g_corners = RC2.addElement("fg", "g", undefined, uid + "-resize-corners");
    var s_edges = g_edges.selectAll("line").data(edges);
    s_edges.enter().append("line");
    s_edges.attr("x1", function(d) { return rect["x" + d[0][0]]; })
           .attr("y1", function(d) { return rect["y" + d[1][0]]; })
           .attr("x2", function(d) { return rect["x" + d[0][1]]; })
           .attr("y2", function(d) { return rect["y" + d[1][1]]; })
           .classed("chartaccent-draghandle-line", true).style({
                "stroke": "none",
                "fill": "none",
                "stroke-width": 5,
                "pointer-events": "all",
                "cursor": function(d) { return d[0][0] != d[0][1] ? "ns-resize" : "ew-resize"; }
            })
           .on("mousedown", function(d) {
                onclick();
                var px0 = d3.event.pageX;
                var py0 = d3.event.pageY;
                setupDragHandlers({
                    mousemove: function() {
                        var px1 = d3.event.pageX;
                        var py1 = d3.event.pageY;
                        var dx = px1 - px0;
                        var dy = py1 - py0;
                        mouse_moved = true;
                        onresize({
                            x1: rect.x1 + ((d[0][0] == 1 && d[0][1] == 1) ? dx : 0),
                            y1: rect.y1 + ((d[1][0] == 1 && d[1][1] == 1) ? dy : 0),
                            x2: rect.x2 + ((d[0][0] == 2 && d[0][1] == 2) ? dx : 0),
                            y2: rect.y2 + ((d[1][0] == 2 && d[1][1] == 2) ? dy : 0)
                        });
                    },
                    mouseup: function() {
                        onclick();
                    }
                });
           });
    var s_corners = g_corners.selectAll("circle").data(corners);
    s_corners.enter().append("circle");
    s_corners
           .attr("cx", function(d) { return rect["x" + d[0]]; })
           .attr("cy", function(d) { return rect["y" + d[1]]; })
           .attr("r", 10)
           .classed("chartaccent-draghandle-range", true).style({
                "stroke": "none",
                "fill": "none",
                "pointer-events": "all",
                "cursor": function(d) {
                    function xor(a, b) {
                        return a ? !b : b;
                    }
                    var judge = xor(xor(rect.x1 < rect.x2, rect.y1 < rect.y2), xor(d[0] == 1, d[1] == 1));
                    return judge ? "nesw-resize" : "nwse-resize";
                }
            })
           .on("mousedown", function(d) {
                onclick();
                var px0 = d3.event.pageX;
                var py0 = d3.event.pageY;
                setupDragHandlers({
                    mousemove: function() {
                        var px1 = d3.event.pageX;
                        var py1 = d3.event.pageY;
                        var dx = px1 - px0;
                        var dy = py1 - py0;
                        mouse_moved = true;
                        onresize({
                            x1: rect.x1 + (d[0] == 1 ? dx : 0),
                            y1: rect.y1 + (d[1] == 1 ? dy : 0),
                            x2: rect.x2 + (d[0] == 2 ? dx : 0),
                            y2: rect.y2 + (d[1] == 2 ? dy : 0)
                        });
                    },
                    mouseup: function() {
                        onclick();
                    }
                });
           });
    if(visible) {
        s_corners.attr("r", 4);
        s_corners.style({
            "stroke": Colors.selection_hint_color,
            "stroke-width": 2,
            "fill": "none"
        });
    }
};

function MakeLineResizer(RC2, visible, uid, line, onresize, onclick) {
    var rect_bg = RC2.addElement("fg", "line", "chartaccent-draghandle-line", uid + "-resize-bg");
    rect_bg.style({
        "stroke": "none",
        "fill": "none",
        "stroke-width": 5,
        "pointer-events": "all",
        "cursor": "move"
    });
    rect_bg.attr("x1", line[0].x);
    rect_bg.attr("y1", line[0].y);
    rect_bg.attr("x2", line[1].x);
    rect_bg.attr("y2", line[1].y);
    rect_bg.on("mousedown", function() {
        onclick();
        var px0 = d3.event.pageX;
        var py0 = d3.event.pageY;
        setupDragHandlers({
            mousemove: function() {
                var px1 = d3.event.pageX;
                var py1 = d3.event.pageY;
                var dx = px1 - px0;
                var dy = py1 - py0;
                mouse_moved = true;
                onresize([
                    { x: line[0].x + dx, y: line[0].y + dy },
                    { x: line[1].x + dx, y: line[1].y + dy }
                ]);
            },
            mouseup: function() {
                onclick();
            }
        });
    });
    var corners = [ [ 0, 0 ], [ 1, 1 ] ];
    var g_corners = RC2.addElement("fg", "g", undefined, uid + "-resize-corners");
    var s_corners = g_corners.selectAll("circle").data(corners);
    s_corners.enter().append("circle");
    s_corners
           .attr("cx", function(d) { return line[d[0]].x; })
           .attr("cy", function(d) { return line[d[0]].y; })
           .attr("r", 10)
           .classed("chartaccent-draghandle-range", true).style({
                "stroke": "none",
                "fill": "none",
                "pointer-events": "all",
                "cursor": function(d) {
                    function xor(a, b) {
                        return a ? !b : b;
                    }
                    var judge = xor(xor(line[0].x < line[1].x, line[0].y < line[1].y), xor(d[0] == 1, d[1] == 1));
                    return judge ? "nesw-resize" : "nwse-resize";
                }
            })
           .on("mousedown", function(d) {
                onclick();
                var px0 = d3.event.pageX;
                var py0 = d3.event.pageY;
                setupDragHandlers({
                    mousemove: function() {
                        var px1 = d3.event.pageX;
                        var py1 = d3.event.pageY;
                        var dx = px1 - px0;
                        var dy = py1 - py0;
                        mouse_moved = true;
                        onresize(line.map(function(p, i) {
                            return {
                                x: d[0] == i ? p.x + dx : p.x,
                                y: d[1] == i ? p.y + dy : p.y
                            };
                        }));
                    },
                    mouseup: function() {
                        onclick();
                    }
                });
           });
    if(visible) {
        s_corners.attr("r", 4);
        s_corners.style({
            "stroke": Colors.selection_hint_color,
            "stroke-width": 2,
            "fill": "none"
        });
    }
};

Annotation.prototype.renderComponentShape = function(RC, RC2, component) {
    if(!this.visible || !component.visible) return;
    var self = this;
    if(component.type == "shape.rect") {
        var rect = RC2.addElement("fg", "rect", undefined, getObjectUniqueID(component));
        rect.attr("x", Math.min(this.target.rect.x1, this.target.rect.x2));
        rect.attr("y", Math.min(this.target.rect.y1, this.target.rect.y2));
        rect.attr("width", Math.abs(this.target.rect.x1 - this.target.rect.x2));
        rect.attr("height", Math.abs(this.target.rect.y1 - this.target.rect.y2));
        rect.style("pointer-events", "none");
        rect.call(function() { Styles.applyStyle(component.style, this); })

        if(RC.isEditing) {
            MakeRectResizer(RC2, RC.isSelected(this), getObjectUniqueID(component), this.target.rect, function(newrect) {
                self.target.rect = newrect;
                DM.invalidate(self);
                RC.validate();
            }, RC2.startPopoutEditor.bind(RC2));
        }
    }
    if(component.type == "shape.oval") {
        var rect = RC2.addElement("fg", "ellipse", undefined, getObjectUniqueID(component));
        rect.attr("cx", (this.target.rect.x1 + this.target.rect.x2) / 2);
        rect.attr("cy", (this.target.rect.y1 + this.target.rect.y2) / 2);
        rect.attr("rx", Math.abs(this.target.rect.x1 - this.target.rect.x2) / 2);
        rect.attr("ry", Math.abs(this.target.rect.y1 - this.target.rect.y2) / 2);
        rect.style("pointer-events", "none");
        rect.call(function() { Styles.applyStyle(component.style, this); })

        if(RC.isEditing) {
            MakeRectResizer(RC2, RC.isSelected(this), getObjectUniqueID(component), this.target.rect, function(newrect) {
                self.target.rect = newrect;
                DM.invalidate(self);
                RC.validate();
            }, RC2.startPopoutEditor.bind(RC2));
        }
    }
    if(component.type == "shape.image") {
        var image = RC2.addElement("bg2", "image", undefined, getObjectUniqueID(component));
        image.attr("x", Math.min(this.target.rect.x1, this.target.rect.x2));
        image.attr("y", Math.min(this.target.rect.y1, this.target.rect.y2));
        image.attr("width", Math.abs(this.target.rect.x1 - this.target.rect.x2));
        image.attr("height", Math.abs(this.target.rect.y1 - this.target.rect.y2));
        image.style("pointer-events", "none");
        if(image.attr("xlink:href") != component.image) {
            image.attr("xlink:href", component.image);
        }
        if(component.meet_or_slice == "slice") {
            image.attr("preserveAspectRatio", "xMidYMid slice");
        } else {
            image.attr("preserveAspectRatio", "xMidYMid meet");
        }
        image.style("opacity", component.opacity);
        if(RC.isEditing) {
            MakeRectResizer(RC2, RC.isSelected(this), getObjectUniqueID(component), this.target.rect, function(newrect) {
                self.target.rect = newrect;
                DM.invalidate(self);
                RC.validate();
            }, RC2.startPopoutEditor.bind(RC2), true);
        }
    }
    if(component.type == "shape.line") {
        var line = RC2.addElement("fg", "line", undefined, getObjectUniqueID(component));
        line.attr("x1", this.target.line[0].x);
        line.attr("y1", this.target.line[0].y);
        line.attr("x2", this.target.line[1].x);
        line.attr("y2", this.target.line[1].y);
        line.call(function() { Styles.applyStyle(component.style, this); })
        line.style({
            "stroke-linecap": "round"
        });
        if(component.arrow.indexOf(">") >= 0) {
            var arrowhead = RC2.addElement("fg", "path", undefined, getObjectUniqueID(component) + "-arrow-1");
            var p1 = new Geometry.Vector(this.target.line[0].x, this.target.line[0].y);
            var p2 = new Geometry.Vector(this.target.line[1].x, this.target.line[1].y);
            var p1_p2 = p1.sub(p2);
            var arrow_size = component.style.stroke_width * component.arrow_size;
            arrowhead.attr("d", Geometry.Path.arrow(arrow_size, p1, p2));
            var adjusted_p2 = p2.add(p1_p2.scale((arrow_size - 1) / p1_p2.length()));
            line.attr("x2", adjusted_p2.x);
            line.attr("y2", adjusted_p2.y);
            arrowhead.style({
                "fill": component.style.stroke != null ? component.style.stroke : "none",
                "stroke": "none"
            });
        }
        if(component.arrow.indexOf("<") >= 0) {
            var arrowhead = RC2.addElement("fg", "path", undefined, getObjectUniqueID(component) + "-arrow-2");
            var p1 = new Geometry.Vector(this.target.line[0].x, this.target.line[0].y);
            var p2 = new Geometry.Vector(this.target.line[1].x, this.target.line[1].y);
            var p2_p1 = p2.sub(p1);
            var arrow_size = component.style.stroke_width * component.arrow_size;
            arrowhead.attr("d", Geometry.Path.arrow(arrow_size, p2, p1));
            var adjusted_p1 = p1.add(p2_p1.scale((arrow_size - 1) / p2_p1.length()));
            line.attr("x1", adjusted_p1.x);
            line.attr("y1", adjusted_p1.y);
            arrowhead.style({
                "fill": component.style.stroke != null ? component.style.stroke : "none",
                "stroke": "none"
            });
        }
        if(RC.isEditing) {
            MakeLineResizer(RC2, RC.isSelected(this), getObjectUniqueID(component), this.target.line, function(newline) {
                self.target.line = newline;
                DM.invalidate(self);
                RC.validate();
            }, RC2.startPopoutEditor.bind(RC2));
        }
    }
}


Annotation.prototype.getBoundingRect = function(RC) {
    if(this.target.type == "freeform") return false;

    var layers = [ "fg", "fg2", "bg" ];

    var body_rect = document.body.parentNode.getBoundingClientRect();
    var current_rect = null;

    function doExtend() {
        if(d3.select(this).classed("edit-widget")) return;
        var srect = this.getBoundingClientRect();
        if(srect.width == 0 && srect.height == 0) return;
        var rect = {
            x1: srect.left, y1: srect.top,
            x2: srect.left + srect.width,
            y2: srect.top + srect.height
        };
        if(current_rect == null) {
            current_rect = rect;
        } else {
            current_rect.x1 = Math.min(current_rect.x1, rect.x1);
            current_rect.y1 = Math.min(current_rect.y1, rect.y1);
            current_rect.x2 = Math.max(current_rect.x2, rect.x2);
            current_rect.y2 = Math.max(current_rect.y2, rect.y2);
        }
    };

    layers.forEach(function(layer) {
        var sel = RC.layers.getAll(layer, this);
        if(sel) sel.each(doExtend);
    }.bind(this));

    if(current_rect) {
        current_rect.x1 -= body_rect.left;
        current_rect.x2 -= body_rect.left;
        current_rect.y1 -= body_rect.top;
        current_rect.y2 -= body_rect.top;
        return current_rect;
    } else {
        return null;
    }
};

var ComponentsEditor = function(info) {
    var self = this;
    this.info = info;
    this.container = info.container;
    var tree = appendTreeOnce(this.container, [
        [ "section", { $: "section" } ]
    ]);
    this.item_container = tree.section;
    this.renderItems();
};

var ToggleStateManager = function() {
    this.components = new WeakMap();
};
ToggleStateManager.prototype.getState = function(component, name, defaultstate) {
    if(this.components.has(component)) {
        var o = this.components.get(component);
        if(o[name] === undefined) {
            o[name] = defaultstate;
            return defaultstate;
        } else {
            return o[name];
        }
    } else {
        var o = { };
        o[name] = defaultstate;
        this.components.set(component, o);
        return defaultstate;
    }
};
ToggleStateManager.prototype.setState = function(component, name, state) {
    if(this.components.has(component)) {
        this.components.get(component)[name] = state ? true : false;
    } else {
        var o = { };
        o[name] = state ? true : false;
        this.components.set(component, o);
    }
};
var toggle_state_manager = new ToggleStateManager();

ComponentsEditor.prototype.renderItems = function() {
    var info = this.info;
    var items = info.getItems();
    // Make sure the DOM element always maps to the right item.
    var div_items = this.item_container.selectAll("div.arrayeditor-container").data(items, getObjectUniqueID);
    div_items.exit().remove();

    var div_items_enter = div_items.enter().append("div").attr("class", "arrayeditor-container");

    var header = div_items_enter.append("h2").classed("subsections", true);

    header.style("cursor", function(d) { return info.canToggle(d) ? "pointer" : "default"});
    var header_left = header.append("span").style("float", "left");
    header_left.append("span")
        .attr("class", "btn btn-toggle")
        .call(IconFont.addIcon("eye"))
        .classed("active", info.getVisibility.bind(info))
        .on("click", function(d) {
            info.setVisibility(d, !info.getVisibility(d));
            if(info.getVisibility(d)) {
                toggle_state_manager.setState(d, "main", true);
                render_toggle_states();
            }
            d3.select(this).classed("active", info.getVisibility(d));
            d3.event.stopPropagation();
        });
    // header.append("span").call(IconFont.addIconOnce("arrow-down")).classed("toggle-icon", true).style({
    //     "display": "inline-block",
    //     "height": "24px",
    //     "margin-left": "3px",
    //     "vertical-align": "top",
    //     "line-height": "24px",
    //     "text-align": "center",
    //     "font-size": "11px"
    // });
    header.append("span").text(" ").style("margin-left", "5px");
    header.append("span").call(IconFont.addIcon(function(d) {
        return info.headerIcon(d);
    }));
    header.append("span").text(function(d) { return info.header(d); }).style("margin-left", "5px");

    header.on("click", function(d) {
        if(!info.canToggle(d)) return;
        toggle_state_manager.setState(d, "main", !toggle_state_manager.getState(d, "main", info.defaultOpen(d)));
        render_toggle_states();
    });

    var render_toggle_states = function() {
        div_items.select("h2 .btn-toggle").classed("active", info.getVisibility).call(IconFont.addIconOnce(function(d) {
            return info.getVisibility(d) ? "correct" : "blank";
        }));
        div_items.select(".content").style("display", function(d) {
            var main = d3.select(this.parentNode);
            var r = toggle_state_manager.getState(d, "main", info.defaultOpen(d));
            if(r) {
                main.select("h2.subsections .toggle-icon").selectAll("*").remove();
                main.select("h2.subsections .toggle-icon").call(IconFont.addIconOnce("arrow-down"));
                return "block";
            } else {
                main.select("h2.subsections .toggle-icon").selectAll("*").remove();
                main.select("h2.subsections .toggle-icon").call(IconFont.addIconOnce("arrow-right"));
                return "none";
            }
        });
        if(d3.event) d3.event.stopPropagation();
    };

    div_items_enter.append("div").classed("content", true);

    div_items.each(function(item) {
        var div_item = d3.select(this);
        info.renderItem(div_item.select(".content"), item);
    });

    var div_none = this.item_container.selectAll("div.arrayeditor-none").data(items.length == 0 ? [ 0 ] : []);
    div_none.enter().append("div").attr("class", "arrayeditor-none").append("i").text("(none)");
    div_none.exit().remove();

    render_toggle_states();
};

var CreateSimpleStyleEditor = function(container, style, validate_and_update, clickout_handlers) {
    var tree = appendTreeOnce(container, [
        [ "span", { text: "Color " } ],
        [ "span", { $: "fill_color" } ],
        [ "span", { text: " " } ],
        [ "span", { text: " Outline " } ],
        [ "span", { $: "stroke_color" } ],
        [ "span", { text: " " } ],
        [ "span", { $: "stroke_width" } ],
        [ "span", { text: " px" } ]
    ]);
    MakeColorPicker(tree.fill_color, style.fill, function(color) {
        style.fill = color;
        validate_and_update();
    }, clickout_handlers);
    MakeStrokeColorPicker(tree.stroke_color, style.stroke, function(color) {
        style.stroke = color;
        validate_and_update();
    }, clickout_handlers);
    MakeNumberInputUpDown(tree.stroke_width, style.stroke_width, 1, [0, 100], function(value) {
        style.stroke_width = value;
        validate_and_update();
    });
};

var CreateSimpleLabelStyleEditor = function(container, style, validate_and_update, clickout_handlers) {
    var tree = appendTreeOnce(container, [
        [ "span", { text: "Color " } ],
        [ "span", { $: "fill_color" } ],
        [ "span", { text: " " } ],
        [ "span", { text: " Outline " } ],
        [ "span", { $: "stroke_color" } ],
        [ "span", { text: " " } ],
        [ "span", { $: "stroke_width" } ],
        [ "span", { text: " px" } ]
    ]);
    MakeColorPicker(tree.fill_color, style.fill, function(color) {
        style.fill = color;
        validate_and_update();
    }, clickout_handlers);
    MakeStrokeColorPicker(tree.stroke_color, style.stroke, function(color) {
        style.stroke = color;
        validate_and_update();
    }, clickout_handlers);
    MakeNumberInputUpDown(tree.stroke_width, style.stroke_width, 1, [0, 100], function(value) {
        style.stroke_width = value;
        validate_and_update();
    });
};


var CreateSimpleFillStyleEditor = function(container, style, validate_and_update, clickout_handlers) {
    var tree = appendTreeOnce(container, [
        [ "span", { text: "Color " } ],
        [ "span", { $: "fill_color" } ]
    ]);
    MakeColorPicker(tree.fill_color, style.fill, function(color) {
        style.fill = color;
        validate_and_update();
    }, clickout_handlers);
};

var CreateSimpleStrokeStyleEditor = function(container, style, validate_and_update, clickout_handlers) {
    var tree = appendTreeOnce(container, [
        [ "span", { text: " Color " } ],
        [ "span", { $: "stroke_color" } ],
        [ "span", { text: " " } ],
        [ "span", { $: "stroke_width" } ],
        [ "span", { text: " px" } ]
    ]);
    MakeStrokeColorPicker(tree.stroke_color, style.stroke, function(color) {
        style.stroke = color;
        validate_and_update();
    }, clickout_handlers);
    MakeNumberInputUpDown(tree.stroke_width, style.stroke_width, 1, [0, 100], function(value) {
        style.stroke_width = value;
        validate_and_update();
    });
};

var CreateHighlightColorEditor = function(container, color, stroke_width, onchange, onchange_strokewidth, clickout_handlers, series_colors) {
    // Cleanup if it's not the same object.
    if(container.node().__color__ !== color) {
        container.selectAll("*").remove();
        container.node().__color__ = color;
    }
    var type_choices = [
        { name: "New Color", value: "color" },
        { name: "Original Color", value: "brighter-darker" },
        { name: "None", value: "none" }
    ];
    var current_type;
    // if(color === null) {
    //     current_type = "none";
    //     var tree = appendTreeOnce(container, [
    //         [ "span", { $: "type" } ]
    //     ]);
    if(color instanceof RGBColor || color === null) {
        if(color === null) current_type = "none";
        else current_type = "color";
        var tree = appendTreeOnce(container, [
            [ "span", { $: "type" } ],
            [ "span", { text: " " } ],
            [ "span", { $: "color" } ],
            [ "span", { text: " " } ],
            [ "span", { $: "stroke_width" } ]
        ]);
        if(stroke_width === undefined) {
            MakeColorPicker(tree.color, color, function(newval) {
                onchange(newval);
            }, clickout_handlers)
        } else {
            MakeStrokeColorPicker(tree.color, color, function(newval) {
                onchange(newval);
            }, clickout_handlers)
        }
    } else {
        var mode = color.mode;
        current_type = mode;
        var tree = appendTreeOnce(container, [
            [ "span", { $: "type" } ],
            [ "span", { text: " " } ],
            // [ "span", { style: { display: "inline-block", "background": "#FFF", "width": "10px", "height": "10px", "box-shadow": "0 0 2px gray", "border-radius": "5px" } } ],
            [ "span", { $: "slider" } ],
            // [ "span", { style: { display: "inline-block", "background": "#000", "width": "10px", "height": "10px", "box-shadow": "0 0 2px gray", "border-radius": "5px" } } ],
            [ "span", { text: " " } ],
            [ "span", { $: "stroke_width" } ]
        ]);
        // var series_colors = ["#99A2E8", "#6FDD44", "#EB84C9"].map(function(d) { return new RGBColor(d); });

        MakeColorfulSlider(tree.slider, -color.value, [-0.8, 1], series_colors, function(newval) {
            color.value = -newval;
            onchange(color);
        }, clickout_handlers);
    }
    if(tree.stroke_width && stroke_width !== undefined) {
        MakeNumberInputUpDown(tree.stroke_width, stroke_width, 1, [0, 100], function(value) {
            onchange_strokewidth(value);
        });
    }
    MakeSelectButton(tree.type, current_type, type_choices, function(newval) {
        if(newval == current_type) return;
        if(newval == "color") {
            onchange(new RGBColor("#5CA3D1", 1));
        }
        if(newval == "brighter-darker") onchange({
            mode: newval,
            value: 0.2
        });
        if(newval == "none") {
            onchange(null);
        }
    }, clickout_handlers);
};

var CreateHighlightStyleEditor = function(container, style, validate_and_update, clickout_handlers, series_colors) {
    var tree = appendTreeOnce(container, [
        [ "dt", { text: "Color" } ],
        [ "dd", { $: "fill_editor" } ],
        [ "dt", { text: "Outline" } ],
        [ "dd", { $: "stroke_editor" } ]
    ]);
    CreateHighlightColorEditor(tree.fill_editor, style.fill, undefined, function(newvalue) {
        style.fill = newvalue;
        validate_and_update();
    }, undefined, clickout_handlers, series_colors);
    CreateHighlightColorEditor(tree.stroke_editor, style.stroke, style.stroke_width, function(newvalue) {
        style.stroke = newvalue;
        validate_and_update();
    }, function(newwidth) {
        style.stroke_width = newwidth;
        validate_and_update();
    }, clickout_handlers, series_colors);
};

var CreateHighlightLineStyleEditor = function(container, style, validate_and_update, clickout_handlers, series_colors) {
    var tree = appendTreeOnce(container, [
        [ "dt", { text: "Line" } ],
        [ "dd", { $: "line_stroke_editor" } ]
    ]);
    CreateHighlightColorEditor(tree.line_stroke_editor, style.line_stroke, style.line_stroke_width, function(newvalue) {
        style.line_stroke = newvalue;
        validate_and_update();
    }, function(newwidth) {
        style.line_stroke_width = newwidth;
        validate_and_update();
    }, clickout_handlers, series_colors);
};

Annotation.prototype.startSelectRangeItems = function(RC, anchor, clickout_handlers) {
    var all_elements = RC.owner.chart_elements.filter(function(d) {
        return d.createHighlightOverlay;
    });
    var show_include_equal = true;
    var range_value = this.target.range.eval(RC.context);
    var is_categorical_scale = !Scales.isScaleNumerical(this.target.axis.getScale());
    if(is_categorical_scale) {
        show_include_equal = false;
    }
    var select = CreateEditorPopup("SelectItems", {
        anchor: anchor.node(),
        parent_clickout_handlers: clickout_handlers,
        serieses: all_elements.map(function(d) { return d.name; }),
        default_include_equal: true,
        show_include_equal: show_include_equal,
        modes: (isArray(range_value) ?
            [
                { name: "Within", value: "within", icon: "range-within" },
                { name: "Outside", value: "without", icon: "range-without" }
            ] : [
                { name: "Below", value: "below", icon: "line-below" },
                { name: "Above", value: "above", icon: "line-above" }
            ]
        ),
        default_mode: isArray(range_value) ? "within" : "above"
    });
    anchor.classed("active", true);
    Events.on(select, "remove", function() {
        anchor.classed("active", false);
    });
    Events.on(select, "selected", function(mode, serieses) {
        anchor.classed("active", false);

        if(is_categorical_scale) {
            if(mode == "within") mode = "within-or-equal";
            if(mode == "without-or-equal") mode = "without";
            if(mode == "above") mode = "above-or-equal";
            if(mode == "below") mode = "below-or-equal";
        }

        var related_annotations = RC.owner.annotations.filter(function(a) {
            return a.target_inherit && a.target === this.target && a.target_inherit.mode == mode;
        }.bind(this));

        if(related_annotations.length > 0) {
            RC.owner.setEditingAnnotation(related_annotations[0]);
            return;
        }

        var label_text = Expression.parse(all_elements[0].default_label);

        var newannotation = new Annotation({
            target: this.target,
            target_inherit: {
                mode: mode,
                serieses: serieses.map(function(d) {
                    for(var i = 0; i < all_elements.length; i++) {
                        if(all_elements[i].name == d) {
                            return all_elements[i];
                        }
                    }
                })
            },
            components: [
                { type: "item-label", anchor: "m,tt", text: label_text, style: Styles.createDefault("item-label"), visible: true },
                { type: "highlight", style: Styles.createDefault("highlight"), visible: true }
            ]
        });
        RC.owner.addAnnotation(newannotation, isArray(range_value) ? undefined : RC.owner.annotations.indexOf(this));
    }.bind(this));
};

Annotation.prototype.renderSelectionBoxHint = function(RC) {
    var bounding_rect = this.getBoundingRect(RC);
    var selection_box = appendOnlyOnce(d3.select("body"), "div", "chartaccent-selection-hint");
    if(bounding_rect) {
        selection_box.style({
            "width": (bounding_rect.x2 - bounding_rect.x1) + "px",
            "height": (bounding_rect.y2 - bounding_rect.y1) + "px",
            "left": (bounding_rect.x1 - 4) + "px",
            "top": (bounding_rect.y1 - 4) + "px",
        });
    } else {
        selection_box.remove();
    }
};
Annotation.prototype.removeSelectionBoxHint = function(RC) {
    var selection_box = appendOnlyOnce(d3.select("body"), "div", "chartaccent-selection-hint");
    selection_box.remove();
};

Annotation.prototype.startPopoutEditor = function(RC) {
    var self = this;

    var bounding_rect = this.getBoundingRect(RC);

    var selection_box = appendOnlyOnce(d3.select("body"), "div", "chartaccent-selection-box");
    if(bounding_rect) {
        selection_box.style({
            "width": (bounding_rect.x2 - bounding_rect.x1) + "px",
            "height": (bounding_rect.y2 - bounding_rect.y1) + "px",
            "left": (bounding_rect.x1 - 4) + "px",
            "top": (bounding_rect.y1 - 4) + "px",
        });
        var cross_button = appendOnlyOnce(selection_box, "span", "cross-button");
        cross_button.call(IconFont.addIconOnce("cross"));
        cross_button.on("mousedown", function() {
            RC.owner.removeAnnotation(self);
            d3.event.stopPropagation();
        });
    } else {
        selection_box.remove();
    }

    RC.owner.panel_editor.selectAll(".nothing").remove();
    if(RC.owner.panel_editor._current_annotation != this) {
        RC.owner.panel_editor._current_annotation = this;
        appendOnlyOnce(RC.owner.panel_editor, "chartaccent-popout").remove();
    }
    var wrapper = appendOnlyOnce(RC.owner.panel_editor, "chartaccent-popout");

    function validate_and_update() {
        DM.invalidate(self);
        RC.validate();
        var bounding_rect = self.getBoundingRect(RC);
        if(bounding_rect) {
            selection_box.style({
                "width": (bounding_rect.x2 - bounding_rect.x1) + "px",
                "height": (bounding_rect.y2 - bounding_rect.y1) + "px",
                "left": (bounding_rect.x1 - 4) + "px",
                "top": (bounding_rect.y1 - 4) + "px"
            });
        }
    };

    var clickout_handlers = null;

    var tree_wrapper = appendTreeOnce(wrapper, [
        [ "h2", { $: "target_text", text: "Target" } ],
        [ "div.section", { $: "target_section" } ],
        [ "div", { $: "select_items" } ],
        [ "div", { $: "components" } ]
    ]);


    if(tree_wrapper.target_section.attr("data-target-type") != this.target.type) {
        tree_wrapper.target_section.selectAll("*").remove();
        tree_wrapper.target_section.attr("data-target-type", this.target.type);
    }

    if(this.target.type == "items") {
        if(this.target_inherit) {
            tree_wrapper.target_text.text("Target (inherited)");
        } else {
            tree_wrapper.target_text.text("Items");
        }
        // var p = appendOnlyOnce(tree_wrapper.target_section, "p").text("" + d3.sum(this.target.items, function(d) { return d.items.length; }) + " manually selected item(s).");
        var str = this.toString();
        if(str.length > 100) str = str.substr(0, 100) + "...";
        var p = appendOnlyOnce(tree_wrapper.target_section, "p").text(str);
    }
    if(this.target.type == "range") {
        if(this.target_inherit) {
            if(Expression.isSimpleFunction(this.target.range, "range")) {
                tree_wrapper.target_text.text("Items " + this.target_inherit.mode.replace("-or-equal", "") + " Range");
            } else {
                tree_wrapper.target_text.text("Items " + this.target_inherit.mode.replace("-or-equal", "") + " Line");
            }
        } else {
            if(Expression.isSimpleFunction(this.target.range, "range")) {
                tree_wrapper.target_text.text("Range");
            } else {
                tree_wrapper.target_text.text("Line");
            }
        }
        if(Expression.isSimpleFunction(this.target.range, "range")) {
            var tree = appendTreeOnce(tree_wrapper.target_section, [
                [ "dl", [
                    [ "dt", { text: this.target.axis.mode.toUpperCase() + " min" } ],
                    [ "dd", [ [ "span", { $: "target_1" } ] ] ],
                    [ "dt", { text: this.target.axis.mode.toUpperCase() + " max" } ],
                    [ "dd", [ [ "span", { $: "target_2" } ] ] ]
                    // [ "dt", { $: "list_dt", text: "Series" } ],
                    // [ "dd", { $: "list_dd" }, [ [ "ul", { $: "list" } ] ] ]
                ]]
            ]);
            MakeExpressionInput(tree.target_1, this.target.range.args[0], function(expr) {
                self.target.range.args[0] = expr;
                if(Expression.isSimpleFunctionApply(expr, "avg")) {
                    self.components.forEach(function(d) {
                        if(d.type == "label") d.text = Expression.parse('format(".1f", value)');
                    });
                }
                validate_and_update();
            }, RC.context);
            MakeExpressionInput(tree.target_2, this.target.range.args[1], function(expr) {
                self.target.range.args[1] = expr;
                if(Expression.isSimpleFunctionApply(expr, "avg")) {
                    self.components.forEach(function(d) {
                        if(d.type == "label") d.text = Expression.parse('format(".1f", value)');
                    });
                }
                validate_and_update();
            }, RC.context);
        } else {
            var tree = appendTreeOnce(tree_wrapper.target_section, [
                [ "dl", [
                    [ "dt", { text: this.target.axis.mode.toUpperCase() } ],
                    [ "dd", [ [ "span", { $: "target" } ] ] ]
                ]]
            ]);
            MakeExpressionInput(tree.target, this.target.range, function(expr) {
                self.target.range = expr;
                if(Expression.isSimpleFunctionApply(expr, "avg")) {
                    self.components.forEach(function(d) {
                        if(d.type == "label") d.text = Expression.parse('format(".1f", value)');
                    });
                }
                validate_and_update();
            }, RC.context);
        }
        // if(self.target_inherit) {
        //     var all_elements = RC.owner.chart_elements.filter(function(d) {
        //         return d.createHighlightOverlay;
        //     });
        //     MakeCheckboxList(tree.list, {
        //         items: all_elements,
        //         name: function(d) { return d.name; },
        //         isChecked: function(d) {
        //             return self.target_inherit.serieses.indexOf(d) >= 0;
        //         },
        //         onToggle: function(d) {
        //             var idx = self.target_inherit.serieses.indexOf(d);
        //             if(idx >= 0) {
        //                 self.target_inherit.serieses.splice(idx, 1);
        //             } else {
        //                 self.target_inherit.serieses.push(d);
        //             }
        //             validate_and_update();
        //             return true;
        //         }
        //     });
        // } else {
        //     tree.list_dt.remove();
        //     tree.list_dd.remove();
        // }
    }
    if(this.target.type == "freeform") {
        tree_wrapper.target_text.remove();
    }

    var on_edit_make_visible = function(c) {
        return function() {
            c.visible = true;
            validate_and_update();
        };
    };

    // Section: Labels
    var editor = new ComponentsEditor({
        annotation: this,
        container: tree_wrapper["components"],
        text: "Components",
        clickout_handlers: clickout_handlers,
        getItems: function(d) {
            return self.components.slice();
        },
        getVisibility: function(d) {
            return d.visible;
        },
        setVisibility: function(d, value) {
            d.visible = value;
            validate_and_update();
        },
        renderItem_Label: function(sel, component) {
            var tree = appendTreeOnce(sel, [
                [ "dl", { $: "dl" }, [
                    [ "dt", { text: "Text" } ],
                    [ "dd", [
                        [ "span", { $: "input_label_text" } ]
                    ]],
                    [ "dt", { text: "Font" } ],
                    [ "dd", [
                        [ "span", { $: "input_label_font_family" } ],
                        [ "span", { text: " " } ],
                        [ "span", { $: "input_label_font_size" } ]
                    ]],
                    [ "dt", { text: "Style" } ],
                    [ "dd", { $: "input_label_style" } ],
                    [ "dt", { text: "Line" } ],
                    [ "dd", [
                        [ "span", { $: "input_label_line" } ]
                    ]]
                    // [ "dt", { text: "Anchor" } ],
                    // [ "dd", [
                    //     [ "span", { $: "input_label_anchor" } ]
                    // ]]
                ]]
            ]);
            MakeEasyStringExpressionInput(tree.input_label_text, component.text, function(expr) {
                component.text = expr;
                on_edit_make_visible(component)();
            });
            MakeSwitchButton(tree.input_label_line, component.line ? "default" : "none", [
                { name: "Off", value: "none" },
                { name: "On", value: "default" }
            ], function(expr) {
                component.line = expr == "default" ? true : false;
                on_edit_make_visible(component)();
            }, clickout_handlers);
            if(tree.input_label_anchor) {
                MakeLabelAnchorSelectButton(tree.input_label_anchor, component.anchor, function(expr) {
                    component.anchor = expr;
                    component.anchor_offset = { x: 0, y: 0 };
                    on_edit_make_visible(component)();
                }, clickout_handlers);
            }
            if(!component.anchor_offset) component.anchor_offset = { x: 0, y: 0 };

            MakeNumberInputFontSize(tree.input_label_font_size, component.style.font_size, 1, [0, 100], function(value) {
                component.style.font_size = value;
                on_edit_make_visible(component)();
            });
            MakeFontSelectButton(tree.input_label_font_family, component.style.font_family, function(value) {
                component.style.font_family = value;
                on_edit_make_visible(component)();
            }, clickout_handlers);
            CreateSimpleLabelStyleEditor(tree.input_label_style, component.style, on_edit_make_visible(component), clickout_handlers);
        },
        renderItem_SimpleStyle: function(sel, component) {
            var dl = appendOnlyOnce(sel, "dl");
            appendOnlyOnce(dl, "dt").text("");
            // sel.append("p").text("Gray region or line...");
            CreateSimpleStyleEditor(appendOnlyOnce(dl, "dd"), component.style, on_edit_make_visible(component), clickout_handlers);
        },
        renderItem_ShapeLineStyle: function(sel, component) {
            var tree = appendTreeOnce(sel, [
                [ "dl", [
                    [ "dt", { text: "" } ],
                    [ "dd", { $: "line_style" } ],
                    [ "dt", { text: "Arrow" } ],
                    [ "dd", [
                        ["span", { $: "mode" }],
                        ["span", { $: "size" }]
                    ] ]
                ]]
            ]);
            CreateSimpleStrokeStyleEditor(tree.line_style, component.style, on_edit_make_visible(component), clickout_handlers);
            MakeSwitchButton(tree.mode, component.arrow, [
                { name: "", value: "<", icon: "line-start" },
                { name: "", value: ">", icon: "line-end" },
                { name: "", value: "<>", icon: "line-start-end" },
                { name: "", value: "none", icon: "line-none" }
            ], function(value) {
                component.arrow = value;
                on_edit_make_visible(component)();
            });
            MakeNumberSlider(tree.size, component.arrow_size, [ 1.5, 20 ], function(value) {
                component.arrow_size = value;
                on_edit_make_visible(component)();
            });
        },
        renderItem_RangeStyle: function(sel, component) {
            var is_line_chart = RC.owner.chart_elements.some(function(d) { return d.has_line; });
            var dl = appendOnlyOnce(sel, "dl");
            if(!Scales.isScaleNumerical(self.target.axis.getScale()) && is_line_chart) {
                appendOnlyOnce(dl, "dt", "extra").text("Mode");
                if(!component.mode) component.mode = "range";
                MakeSwitchButton(appendOnlyOnce(appendOnlyOnce(dl, "dd", "extra"), "span"), component.mode, [
                    { name: "Range", value: "range" },
                    { name: "Line", value: "line" }
                ], function(value) {
                    if(component.mode == value) return;
                    component.mode = value;
                    dl.selectAll("*").remove();
                    if(value == "line") {
                        component.style = Styles.createDefault("range-line");
                    } else {
                        component.style = Styles.createDefault("range");
                    }
                    on_edit_make_visible(component)();
                });
            }
            appendOnlyOnce(dl, "dt", "main").text("");
            // sel.append("p").text("Gray region or line...");
            if(component.mode == "line") {
                CreateSimpleStrokeStyleEditor(appendOnlyOnce(dl, "dd", "main"), component.style, on_edit_make_visible(component), clickout_handlers);
            } else {
                CreateSimpleStyleEditor(appendOnlyOnce(dl, "dd", "main"), component.style, on_edit_make_visible(component), clickout_handlers);
            }
        },
        renderItem_RangeLineStyle: function(sel, component) {
            var dl = appendOnlyOnce(sel, "dl");
            appendOnlyOnce(dl, "dt").text("");
            // sel.append("p").text("Gray region or line...");
            CreateSimpleStrokeStyleEditor(appendOnlyOnce(dl, "dd"), component.style, on_edit_make_visible(component), clickout_handlers);
        },
        getSeriesColors: function() {
            var colors = new Set();
            self.forEachElementsItem(RC, function(elements, item) {
                if(!elements.getItemColor) return;
                var color = elements.getItemColor(item);
                colors.add(color.r + "," + color.g + "," + color.b);
            });
            return Array.from(colors).map(function(d) { return new RGBColor("rgb(" + d + ")"); });
        },
        renderItem_Highlight: function(sel, component) {
            var dl = appendOnlyOnce(sel, "dl");
            CreateHighlightStyleEditor(dl, component.style, on_edit_make_visible(component), clickout_handlers, this.getSeriesColors());
        },
        renderItem_HighlightLine: function(sel, component) {
            var dl = appendOnlyOnce(sel, "dl");
            CreateHighlightLineStyleEditor(dl, component.style, on_edit_make_visible(component), clickout_handlers, this.getSeriesColors());
        },
        renderItem_Trendline: function(sel, component) {
            sel.selectAll("*").remove();
            var dl = sel.append("dl");
            dl.append("dt").text("");
            var input_label_anchor = dl.append("dd");
            CreateSimpleStrokeStyleEditor(input_label_anchor, component.style, on_edit_make_visible(component), clickout_handlers);
        },
        renderItem_Bubbleset: function(sel, component) {
            sel.selectAll("*").remove();
            var dl = sel.append("dl");
            dl.append("dt").text("Style");
            var input_label_anchor = dl.append("dd");
            CreateSimpleFillStyleEditor(input_label_anchor, component.style, on_edit_make_visible(component), clickout_handlers);
            dl.append("dt").text("Radius");
            if(component.sigma === undefined) component.sigma = 10;
            MakeNumberInputUpDown(dl.append("dd").append("span"), component.sigma, 1, [ 1, 20 ], function(d) {
                component.sigma = d;
                on_edit_make_visible(component)();
            });

        },
        renderItem_ImageChooser: function(sel, component) {
            var tree = appendTreeOnce(sel, [
                [ "dl", { $: "dl" }, [
                    [ "dt", { text: "Image" } ],
                    [ "dd", [
                        [ "span.btn", { $: "image_chooser", text: "Choose Image..." } ],
                        [ "input", { $: "input_file", attr: { type: "file" }, style: { display: "none" } } ],
                    ]],
                    [ "dt", { text: "Opacity" } ],
                    [ "dd", [
                        [ "span", { $: "slider_opacity" } ]
                    ]],
                    [ "dt", { text: "Mode" } ],
                    [ "dd", [
                        [ "span", { $: "meet_or_slice" } ]
                    ]]
                ]]
            ]);
            tree.image_chooser.on("click", function() {
                tree.input_file.node().files = [];
                tree.input_file.node().click();
                tree.input_file.node().onchange = function() {
                    var file = tree.input_file.node().files[0];
                    if(!file) return;
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var content = e.target.result;
                        component.image = content;
                        on_edit_make_visible(component)();
                    }
                    reader.readAsDataURL(file);
                };
            });
            MakeNumberSlider(tree.slider_opacity, component.opacity, [ 0, 1 ], function(newval) {
                component.opacity = newval;
                on_edit_make_visible(component)();
            });
            MakeSwitchButton(tree.meet_or_slice, component.meet_or_slice == "slice" ? "slice" : "meet", [
                { name: "Meet", value: "meet" },
                { name: "Slice", value: "slice" }
            ], function(value) {
                component.meet_or_slice = value;
                on_edit_make_visible(component)();
            });
        },
        renderItem: function(sel, component) {
            if(component.type == "range") return this.renderItem_RangeStyle(sel, component);
            if(component.type == "range-line") return this.renderItem_RangeLineStyle(sel, component);
            if(component.type == "label" || component.type == "item-label") return this.renderItem_Label(sel, component);
            if(component.type == "highlight") return this.renderItem_Highlight(sel, component);
            if(component.type == "highlight-line") return this.renderItem_HighlightLine(sel, component);
            if(component.type == "trendline") return this.renderItem_Trendline(sel, component);
            if(component.type == "bubbleset") return this.renderItem_Bubbleset(sel, component);
            if(component.type == "shape.rect") return this.renderItem_SimpleStyle(sel, component);
            if(component.type == "shape.oval") return this.renderItem_SimpleStyle(sel, component);
            if(component.type == "shape.image") return this.renderItem_ImageChooser(sel, component);
            if(component.type == "shape.line") return this.renderItem_ShapeLineStyle(sel, component);
        },
        addList: [
            { name: "Label", value: "item-label", icon: "item-label" },
            { name: "Marker(s)", value: "highlight", icon: "bars" },
            { name: "Line", value: "highlight-line", icon: "lines" },
            { name: "Label", value: "label", icon: "shape-label" },
            { name: "Value Range", value: "range", icon: "range" },
            { name: "Value Line", value: "range-line", icon: "range-line" },
            { name: "Trendline", value: "trendline", icon: "trendline" },
            { name: "BubbleSet", value: "bubbleset", icon: "bubbleset" },
            { name: "Image", value: "shape.image", icon: "shape-image" },
            { name: "Rectangle", value: "shape.rect", icon: "shape-rect" },
            { name: "Oval", value: "shape.oval", icon: "shape-oval" },
            { name: "Line/Arrow", value: "shape.line", icon: "shape-arrow" },
        ],
        header: function(d) {
            return this.addList.filter(function(l) { return d.type == l.value; })[0].name;
        },
        headerIcon: function(d) {
            return this.addList.filter(function(l) { return d.type == l.value; })[0].icon;
        },
        defaultOpen: function(item) {
            return true;
            if(self.target.type == "freeform") return true;
            return !this.canToggle(item);
            // if(!this.canToggle(item)) return true;
            // if(item.type == "label" || item.type == "item-label") return false;
            // return true;
        },
        canToggle: function(item) {
            // if(item.type == "label" || item.type == "item-label") return true;
            return false;
            // if(item.type == "range-line" || item.type == "range") {
            //     return false;
            // }
            // if(item.type == "trendline" || item.type.match(/^shape\./)) {
            //     return false;
            // }
            // return true;
        }
    });

    if(this.target.type == "range" && !this.target_inherit) {
        if(Expression.isSimpleFunction(this.target.range, "range")) {
            var select_items_text = "Select Items Using this Range";
        } else {
            var select_items_text = "Select Items Using this Line";
        }
        var tree = appendTreeOnce(tree_wrapper.select_items, [
            [ "p", [
                [ "span.btn", { $: "select_range", text: select_items_text + " " } ]
            ]]
        ]);
        tree.select_range.call(IconFont.addIconOnce("arrow-down"));

        tree.select_range.on("click", function() {
            this.startSelectRangeItems(RC, tree.select_range, clickout_handlers);
        }.bind(this));
    }
    // if((this.target.type == "range" && this.target_inherit) || (this.target.type == "items" && this.target_inherit != "trendline")) {
    //     var annotation = this;
    //     var tree = appendTreeOnce(tree_wrapper.select_items, [
    //         [ "p", [
    //             [ "span.btn", { $: "add_trendline", text: "Add Trendline" } ]
    //         ]]
    //     ]);
    //     tree.add_trendline.on("click", function() {
    //         RC.owner.addAnnotation(new Annotation({
    //             target: annotation.target,
    //             target_inherit: "trendline",
    //             components: [
    //                 { type: "trendline", style: Styles.createDefault("trendline") }
    //             ]
    //         }));
    //     }.bind(this));
    // }
};


Annotation.prototype.renderComponent = function(RC, RC2, component) {
    if(component.type == "range") this.renderComponentRange(RC, RC2, component);
    if(component.type == "range-line") this.renderComponentRange(RC, RC2, component);
    if(component.type == "label") this.renderComponentLabel(RC, RC2, component);
    if(component.type == "item-label") this.renderComponentItemLabel(RC, RC2, component);
    if(component.type == "highlight") this.renderComponentHighlight(RC, RC2, component);
    if(component.type == "highlight-line") this.renderComponentHighlightLine(RC, RC2, component);
    if(component.type == "trendline") this.renderComponentTrendline(RC, RC2, component);
    if(component.type == "bubbleset") this.renderComponentBubbleset(RC, RC2, component);
    if(component.type.substr(0, 6) == "shape.") this.renderComponentShape(RC, RC2, component);
};

// Only for "items" target type.
Annotation.prototype.getHighlightElementsExtent = function() {
    var bounding_extent_rect = null;
    var descs = this.target.items;
    this.components.forEach(function(c) {
        if(c.type == "highlight") {
            descs.forEach(function(desc) {
                var items = desc.items;
                var elements = desc.elements;
                items.forEach(function(item) {
                    var extent = elements.getItemExtent(item);
                    if(extent.polyline) {
                        extent.rect = {
                            x1: d3.min(extent.polyline.points, function(d) { return d.x; }),
                            y1: d3.min(extent.polyline.points, function(d) { return d.y; }),
                            x2: d3.max(extent.polyline.points, function(d) { return d.x; }),
                            y2: d3.max(extent.polyline.points, function(d) { return d.y; })
                        };
                    }
                    if(!bounding_extent_rect) {
                        bounding_extent_rect = extent.rect;
                    } else {
                        bounding_extent_rect.x1 = Math.min(bounding_extent_rect.x1, extent.rect.x1);
                        bounding_extent_rect.y1 = Math.min(bounding_extent_rect.y1, extent.rect.y1);
                        bounding_extent_rect.x2 = Math.max(bounding_extent_rect.x2, extent.rect.x2);
                        bounding_extent_rect.y2 = Math.max(bounding_extent_rect.y2, extent.rect.y2);
                    }
                });
            });
        }
    });
    if(bounding_extent_rect) {
        return {
            "type": "rect",
            rect: bounding_extent_rect
        };
    } else {
        return null;
    }
};

Annotation.prototype.toString = function() {
    if(this.target.type == "range") {
        if(this.target_inherit) {
            var mode_string = {
                "within": "within",
                "without": "outside",
                "above": ">",
                "below": "<",
                "within-or-equal": "within or equal",
                "without-or-equal": "outside or equal",
                "above-or-equal": ">=",
                "below-or-equal": "<="
            };
            var axis = this.target.axis.mode == "x" ? "X" : "Y";
            return axis + " " + mode_string[this.target_inherit.mode] + " " + this.target.range.toString();
        } else {
            var axis = this.target.axis.mode == "x" ? "X" : "Y";
            return axis + ": " + this.target.range.toString();
        }
    }
    if(this.target.type == "items") {
        var serieses = { };
        this.target.items.forEach(function(desc) {
            var items = desc.items;
            var elements = desc.elements;
            items.forEach(function(item) {
                if(!serieses[elements.name]) serieses[elements.name] = new Set();
                serieses[elements.name].add(elements.itemToString(item));
            });
        });
        var series_names = getObjectKeys(serieses).sort();
        var itemnames = series_names.map(function(x) {
            return x + ": " + Array.from(serieses[x]).sort().join(", ");
        }).join("; ");
        if(this.target_inherit == "trendline") {
            return "Trendline: " + itemnames;
        } else {
            return itemnames;
        }
    }
    return "TODO: Description";
};

Annotation.prototype.getAllItems = function() {
    var data_items = new Set();
    this.target.items.forEach(function(desc) {
        var items = desc.items;
        var elements = desc.elements;
        items.forEach(function(item) { data_items.add(item); });
    });
    return Array.from(data_items);
};

Annotation.prototype.render = function(RC) {
    var RC2 = { RC: RC };
    var attached_values = { };

    RC2.annotation = this;
    var added_elements = new Set();
    RC2.addElement = function(layer, element, classname, unique_id) {
        var elem = RC.layers.add(layer, this.annotation, element, classname, unique_id);
        added_elements.add(elem.node());
        return elem;
    };

    if(this.target.type == "range") {
        var range = this.target.range.eval(RC.context);
        RC2.range = range;

        attached_values.value = range;

        if(this.target.axis) {
            RC2.axis = this.target.axis;
            RC2.range_rect = RC2.axis.getRangeRect(range);
            RC2.extent = {
                type: "rect",
                rect: RC2.range_rect
            };
        }
    }

    if(this.target.type == "items") {
        attached_values["items"] = this.getAllItems();
        RC2.extent = this.getHighlightElementsExtent();
    }

    if(this.target.type == "freeform") {
        if(this.target.point) {
            RC2.extent = {
                type: "rect",
                rect: {
                    x1: this.target.point.x, y1: this.target.point.y,
                    x2: this.target.point.x, y2: this.target.point.y
                }
            };
        }
        if(this.target.rect) {
            RC2.extent = {
                type: "rect",
                rect: {
                    x1: this.target.rect.x1, y1: this.target.rect.y1,
                    x2: this.target.rect.x2, y2: this.target.rect.y2
                }
            };
        }
        if(this.target.line) {
            RC2.extent = {
                type: "rect",
                rect: {
                    x1: this.target.line[0].x, y1: this.target.line[0].y,
                    x2: this.target.line[1].x, y2: this.target.line[1].y
                }
            };
        }
    }

    RC2.context = Expression.CreateContext(attached_values, RC.context);

    RC2.startPopoutEditor = function() {
        RC.owner.setEditingAnnotation(RC2.annotation);
    };

    if(this.components) {
        for(var i = 0; i < this.components.length; i++) {
            this.renderComponent(RC, RC2, this.components[i]);
        }
    }

    // Cleanup extra elements.
    ["fg", "fg2", "bg"].forEach(function(layer) {
        var sel = RC.layers.getAll(layer, RC2.annotation);
        if(!sel) return;
        sel.each(function() {
            if(!added_elements.has(this)) {
                d3.select(this).remove();
            }
        });
    });
};

function CloneAnnotations(annotations) {
    var target_map = new WeakMap();

    function clone_target(target) {
        if(target.type == "items") {
            return {
                type: target.type,
                items: target.items.map(function(d) {
                    return {
                        elements: d.elements,
                        items: d.items.slice()
                    };
                })
            };
        }
        if(target.type == "range") {
            return {
                type: target.type,
                axis: target.axis,
                range: target.range.clone()
            };
        }
        if(target.type == "freeform") {
            return shallow_clone_object(target);
        }
        return target;
    }

    // function clone_target_inherit(target_inherit) {
    //     console.log(target_inherit);
    //     return target_inherit;
    // }

    function shallow_clone_object(obj) {
        if(obj === null || obj === undefined || typeof(obj) != "object") return obj;
        if(obj.constructor !== Object) {
            if(obj.clone) {
                return obj.clone();
            } else {
                console.log("Warning: incorrect type", obj, obj.constructor);
                return obj;
            }
        }
        var new_obj = { };
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                if(obj[key] instanceof Array) {
                    new_obj[key] = obj[key].map(function(d) { return shallow_clone_object(d); });
                } else {
                    new_obj[key] = shallow_clone_object(obj[key]);
                }
            }
        }
        return new_obj;
    }

    annotations.forEach(function(a) {
        target_map.set(a.target, clone_target(a.target));
    });

    return annotations.map(function(annotation) {
        var o = Object.create(Annotation.prototype);
        o.target = target_map.get(annotation.target);
        o.target_inherit = shallow_clone_object(annotation.target_inherit);
        o.components = annotation.components.map(shallow_clone_object);
        o.visible = annotation.visible;
        o.id = annotation.id;
        return o;
    });
};

Module.Annotation = Annotation;



var ChartElements = {
    Create: function(owner, type, info) {
        return new ChartElements[type](owner, info);
    }
};

ChartElements.axis = function(owner, info) {
    this.name = info.name;
    this.owner = owner;
    if(info.default_label) {
        this.default_label = info.default_label;
    }
    if(info.default_range_label) {
        this.default_range_label = info.default_range_label;
    }
    if(info.default_format) {
        this.default_format = info.default_format;
    }
};

ChartElements.axis.prototype.setChart = function(chart) {
    this.chart = chart;
};

ChartElements.axis.prototype.setMode = function(value) {
    this.mode = value;
};

ChartElements.axis.prototype.setOrigin = function(value) {
    this.origin = value;
};

ChartElements.axis.prototype.getRangeRect = function(range) {
    if(this.mode == "x") {
        var px = Scales.getScaleValueRange(this.chart.cartesian_scales.x, range);
        var py = Scales.getScaleRangeExtent(this.chart.cartesian_scales.y);
    } else {
        var px = Scales.getScaleRangeExtent(this.chart.cartesian_scales.x);
        var py = Scales.getScaleValueRange(this.chart.cartesian_scales.y, range);
    }
    return {
        x1: px[0], y1: py[0],
        x2: px[1], y2: py[1]
    }
};

ChartElements.axis.prototype.getScale = function() {
    return this.chart.cartesian_scales[this.mode];
};

ChartElements.axis.prototype.select = function(p, always_select, pair_value) {
    var self = this;
    if(this.mode == "x") {
        var range = Scales.getScaleRangeExtent(this.chart.cartesian_scales.x);
        var p1 = new Geometry.Vector(range[0], this.origin);
        var p0 = new Geometry.Vector(range[range.length - 1], this.origin);
    }
    if(this.mode == "y") {
        var range = Scales.getScaleRangeExtent(this.chart.cartesian_scales.y);
        var p0 = new Geometry.Vector(this.origin, range[0]);
        var p1 = new Geometry.Vector(this.origin, range[range.length - 1]);
    }
    var d = Geometry.pointLineSegmentSignedDistance(p, p0, p1);
    var value = null;
    if(d >= 0 && d <= 40 || always_select) {
        d = 0;
        if(this.mode == "x") {
            var value = Scales.getScaleInverseClampSnap(this.chart.cartesian_scales.x, p.x, pair_value);
        }
        if(this.mode == "y") {
            var value = Scales.getScaleInverseClampSnap(this.chart.cartesian_scales.y, p.y, pair_value);
        }
    } else {
        return null;
    }
    return {
        distance: d,
        p0: p0, p1: p1,
        value: value,
        d: null
    }
};

ChartElements.axis.prototype.render = function(g, selection) {
    var p0 = selection.p0;
    var p1 = selection.p1;
    if(selection.value !== null) {
        var path = g.append("path");
        if(this.mode == "x") {
            var px = Scales.getScaleValueRange(this.chart.cartesian_scales.x, selection.value);
            var py = Scales.getScaleRangeExtent(this.chart.cartesian_scales.y);
            path.attr("d", Geometry.Path.rect(px[0], py[0], px[1] - px[0], py[1] - py[0]));
        }
        if(this.mode == "y") {
            var px = Scales.getScaleRangeExtent(this.chart.cartesian_scales.x);
            var py = Scales.getScaleValueRange(this.chart.cartesian_scales.y, selection.value);
            path.attr("d", Geometry.Path.rect(px[0], py[0], px[1] - px[0], py[1] - py[0]));
        }
        path.style({
            "fill": Colors.selection_hint_color,
            "fill-opacity": 0.5,
            "stroke": Colors.selection_hint_color,
            "stroke-width": 2
        });
    }
};

ChartElements.axis.prototype.renderBetween = function(g, selection1, selection2) {
    if(selection1.value !== null && selection2.value !== null) {
        var path = g.append("path");
        if(this.mode == "x") {
            var px1 = Scales.getScaleValueRange(this.chart.cartesian_scales.x, selection1.value);
            var px2 = Scales.getScaleValueRange(this.chart.cartesian_scales.x, selection2.value);
            var py = Scales.getScaleRangeExtent(this.chart.cartesian_scales.y);
            var px_min = Math.min(px1[0], px1[1], px2[0], px2[1]);
            var px_max = Math.max(px1[0], px1[1], px2[0], px2[1]);
            path.attr("d", Geometry.Path.rect(px_min, py[0], px_max - px_min, py[1] - py[0]));
        }
        if(this.mode == "y") {
            var px = Scales.getScaleRangeExtent(this.chart.cartesian_scales.x);
            var py1 = Scales.getScaleValueRange(this.chart.cartesian_scales.y, selection1.value);
            var py2 = Scales.getScaleValueRange(this.chart.cartesian_scales.y, selection2.value);
            var py_min = Math.min(py1[0], py1[1], py2[0], py2[1]);
            var py_max = Math.max(py1[0], py1[1], py2[0], py2[1]);
            path.attr("d", Geometry.Path.rect(px[0], py_min, px[1] - px[0], py_max - py_min));
        }
        path.style({
            "fill": Colors.selection_hint_color,
            "fill-opacity": 0.1,
            "stroke": "none"
        });
    }
};

ChartElements.axis.prototype.renderGuides = function(RC) {
    // if(!Scales.isScaleNumerical(this.chart.cartesian_scales[this.mode])) return;
    var self = this;
    // Select range between existing ranges.
    var sep_points = [];
    var axis_scale = this.chart.cartesian_scales[this.mode];
    if(Scales.isScaleNumerical(axis_scale)) {
        var range_extent = Scales.getScaleRangeExtent(axis_scale);
        var is_ordinal = false;
        var ScaleValueType = Expression.Number;
    } else {
        // For categorical scales, get the exact extent.
        var range = axis_scale.range();
        var range_extent = [ range[0], range[range.length - 1] + axis_scale.rangeBand() ];
        var is_ordinal = true;
        var ScaleValueType = Expression.String;
    }
    this.owner.annotations.forEach(function(a) {
        if(a.target.type == "range" && a.target.axis == self && !a.target_inherit) {
            var range = a.target.range.eval(RC.context);
            var range_extent = Scales.getScaleValueRange(axis_scale, range);
            if(Expression.isSimpleFunction(a.target.range, "range")) {
                var expr1 = a.target.range.args[0];
                var expr2 = a.target.range.args[1];
            } else {
                var expr1 = a.target.range;
                var expr2 = a.target.range;
            }
            var modevalue = range_extent[0] < range_extent[1] ? 0 : 1;
            if(is_ordinal) {
                var processed_expr1 = new ScaleValueType(Scales.getPreviousValue(axis_scale, expr1.eval(RC.context)));
                var processed_expr2 = new ScaleValueType(Scales.getNextValue(axis_scale, expr2.eval(RC.context)));
            } else {
                var processed_expr1 = expr1;
                var processed_expr2 = expr2;
            }
            if(!isArray(range)) {
                sep_points.push({
                    pos: range_extent[0],
                    mode: modevalue,
                    expression: processed_expr1,
                    parent: a
                });
                sep_points.push({
                    pos: range_extent[1],
                    mode: 1 - modevalue,
                    expression: processed_expr2,
                    parent: a
                });
            } else {
                sep_points.push({
                    pos: range_extent[0],
                    mode: modevalue,
                    expression: processed_expr1,
                    parent: null
                });
                sep_points.push({
                    pos: range_extent[1],
                    mode: 1 - modevalue,
                    expression: processed_expr2,
                    parent: null
                });
            }
        }
    });
    sep_points.sort(function(a, b) {
        if(a.pos == b.pos) return a.mode - b.mode;
        return a.pos - b.pos;
    });
    // We need to have something.
    var sep_ranges = [];
    if(sep_points.length > 0) {
        var is_in_range = 0;
        if(range_extent[0] < range_extent[1]) {
            var previous_pos = range_extent[0];
            var previous_expr = new ScaleValueType(axis_scale.domain()[0]);
            var previous_parent = null;
        } else {
            var previous_pos = range_extent[1];
            var previous_expr = new ScaleValueType(axis_scale.domain()[axis_scale.domain().length - 1]);
            var previous_parent = null;
        }

        var make_result = function(previous_pos, pos, previous_expr, expr, previous_parent, parent) {
            var r = { range_expression: null, value: null, range_position: [ previous_pos, pos ], parents: [ previous_parent, parent ] };
            if(is_ordinal) {
                if(range_extent[0] < range_extent[1]) {
                    r.range_expression = new Expression.Function(new Expression.Variable("range"), [ previous_expr, expr ], { });
                } else {
                    r.range_expression = new Expression.Function(new Expression.Variable("range"), [ expr, previous_expr ], { });
                }
            } else {
                if(range_extent[0] < range_extent[1]) {
                    r.range_expression = new Expression.Function(new Expression.Variable("range"), [ previous_expr, expr ], { });
                } else {
                    r.range_expression = new Expression.Function(new Expression.Variable("range"), [ expr, previous_expr ], { });
                }
            }
            r.value = r.range_expression.eval(RC.context);
            sep_ranges.push(r);
        };

        for(var i = 0; i < sep_points.length; i++) {
            var pos = sep_points[i].pos;
            var expr = sep_points[i].expression;
            var parent = sep_points[i].parent;
            if(is_in_range == 0 && pos > previous_pos + 5) {
                make_result(previous_pos, pos, previous_expr, expr, previous_parent, parent);
            }
            previous_pos = pos;
            previous_expr = expr;
            var previous_parent = parent;
            if(sep_points[i].mode == 0) is_in_range += 1;
            if(sep_points[i].mode == 1) is_in_range -= 1;
        }
        if(range_extent[0] < range_extent[1]) {
            var pos = range_extent[1];
            var expr = new ScaleValueType(axis_scale.domain()[axis_scale.domain().length - 1]);
        } else {
            var pos = range_extent[0];
            var expr = new ScaleValueType(axis_scale.domain()[0]);
        }
        if(is_in_range == 0 && pos > previous_pos + 5) {
            make_result(previous_pos, pos, previous_expr, expr, previous_parent, null);
        }
    }
    var g_ranges = RC.layers.add("fg", this, "g", "ranges");
    g_ranges.classed("chartaccent-edit-widget", true);
    if(this.mode == "y") {
        g_ranges.attr("transform", "translate(" + Scales.getScaleRangeExtent(this.chart.cartesian_scales.x)[1] + ",0)");
    } else {
        g_ranges.attr("transform", "translate(0," + (Scales.getScaleRangeExtent(this.chart.cartesian_scales.y)[1]) + ")");
    }

    var tabs = g_ranges.selectAll("g.tab").data(sep_ranges);
    tabs.enter().append("g").attr("class", "tab");
    tabs.call(Widgets.RangeTab({
        orientation: this.mode == "y" ? "vertical" : "horizontal",
        t1: function(d) { return d.range_position[0] },
        t2: function(d) { return d.range_position[1] },
        buttons: [ "more" ],
        onClick: function(d, button) {
            var sel = d.range_expression;
            if(self.default_format) {
                var text = Expression.parse('formatRange("' + self.default_format + '", value)');
            } else {
                var text = Expression.parse('formatRange("s", value)');
            }
            var annotation = new Annotation({
                target: {
                    type: "range",
                    axis: self,
                    range: sel
                },
                components: [
                    {
                        type: "label",
                        text: text, anchor: self.mode == "x" ? "m,t" : "r,t",
                        style: Styles.createDefault("label")
                    },
                    {
                        type: "range",
                        style: Styles.createDefault("range")
                    }
                ]
            });
            var min_parent_index = undefined;
            for(var p in d.parents) {
                if(d.parents[p] !== null) {
                    var idx = self.owner.getAnnotationPosition(d.parents[p]);
                    if(min_parent_index === undefined || min_parent_index > idx) {
                        min_parent_index = idx;
                    }
                }
            }
            self.owner.addAnnotation(annotation, min_parent_index);
        }
    }));
};

ChartElements.axis.prototype.beginCreation = function(layer_hint, selection, callback) {
    var hint0 = layer_hint.append("g");
    var hint1 = layer_hint.append("g");
    var hint2 = layer_hint.append("g");

    var axis_scale = this.chart.cartesian_scales[this.mode];

    var context = { };
    var value = selection.value;

    this.render(hint1, selection);

    if(value === null || value === undefined) return context;
    var value2 = null;
    context.mousemove = function(pt) {
        hint2.selectAll("*").remove();
        hint0.selectAll("*").remove();
        var sel = this.select(pt, true, value);
        if(sel && sel.value !== null) {
            value2 = sel.value;
        } else {
            value2 = null;
        }
        this.renderBetween(hint0, selection, sel);
        this.render(hint2, sel);
    }.bind(this);
    context.mouseup = function() {
        var is_range = false;
        if(Scales.isScaleNumerical(axis_scale)) {
            // Numerical scale.
            if(value2 !== null) {
                is_range = true;
                if(value < value2) {
                    var sel = Expression.createNumberRange(value, value2);
                } else {
                    var sel = Expression.createNumberRange(value2, value);
                }
                if(this.default_range_label) {
                    var text = Expression.parse(this.default_range_label);
                } else if(this.default_format) {
                    var text = Expression.parse('formatRange("' + this.default_format + '", value)');
                } else {
                    var text = Expression.parse('formatRange("s", value)');
                }
            } else {
                is_range = false;
                var sel = new Expression.Number(value);
                if(this.default_label) {
                    var text = Expression.parse(this.default_label);
                } else if(this.default_format) {
                    var text = Expression.parse('format("' + this.default_format + '", value)');
                } else {
                    var text = Expression.parse('format("s", value)');
                }
            }
        } else {
            // Categorical scale.
            if(value2 !== null && !(isObject(value) && value.min == value2.min && value.max == value2.max)) {
                is_range = true;
                if(isObject(value)) {
                    if(value.max && value2.min && value.max <= value2.min) {
                        value = value.max;
                        value2 = value2.min;
                    } else
                    if(value.min && value2.max && value.min >= value2.max) {
                        value = value.min;
                        value2 = value2.max;
                    } else {
                        // shouldn't go here.
                    }
                }
                if(value < value2) {
                    var sel = Expression.createStringRange(value, value2);
                } else {
                    var sel = Expression.createStringRange(value2, value);
                }
                if(this.default_range_label) {
                    var text = Expression.parse(this.default_range_label);
                } else if(this.default_format) {
                    var text = Expression.parse('formatRange("' + this.default_format + '", value)');
                } else {
                    var text = Expression.parse('formatRange("s", value)');
                }
            } else {
                is_range = false;
                if(isObject(value)) {
                    var sel = new Expression.String(value);
                    if(this.default_label) {
                        var text = Expression.parse(this.default_label);
                    } else if(this.default_format) {
                        var text = Expression.parse('format("' + this.default_format + '", value)');
                    } else {
                        var text = Expression.parse('format("s", value)');
                    }
                } else {
                    var sel = new Expression.createStringRange(value, value);
                    if(this.default_label) {
                        var text = Expression.parse(this.default_label);
                    } else if(this.default_format) {
                        var text = Expression.parse('formatRange("' + this.default_format + '", value)');
                    } else {
                        var text = Expression.parse('formatRange("s", value)');
                    }
                }
            }
        }
        var display_as_range = is_range || (!Scales.isScaleNumerical(this.getScale()) && !isObject(value))
        var annotation = new Annotation({
            target: {
                type: "range",
                axis: this,
                range: sel
            },
            components: [
                {
                    type: "label",
                    text: text,
                    anchor: this.mode == "x" ? (!display_as_range ? "r,t" : "m,t") : (display_as_range ? "r,t": "r,tt"),
                    style: Styles.createDefault("label")
                },
                {
                    type: display_as_range ? "range" : "range-line",
                    style: display_as_range ? Styles.createDefault("range") : Styles.createDefault("range-line")
                }
            ]
        });
        callback(annotation);
    }.bind(this);
    return context;
};

ChartElements.series = function(owner, info) {
    this.owner = owner;
    this.name = info.name;
    this.elements = [];
    this.item2element = new WeakMap();
    this.has_line = false;

    if(info.default_label) {
        // Default item label.
        this.default_label = info.default_label;
    }
    if(info.getAxisValue) {
        // Function to determine is an item in a range.
        this.getAxisValue = info.getAxisValue;
    }
    if(info.getValue) {
        this.getValue = info.getValue;
    }
    if(info.getColor) {
        this.getColor = info.getColor;
    }
    if(info.itemToString) {
        this.item_to_string = info.itemToString;
    }
    if(info.bubbleset) {
        this.bubbleset = info.bubbleset;
    }
};

// [ "rect", p1, p2, p3, p4 ], [ "circle", center, radius ]
ChartElements.series.prototype.setItems = function(data, elements, points) {
    this.elements = [];
    this.item2element = new WeakMap();
    this.has_line = points ? true : false;
    for(var i = 0; i < elements.length; i++) {
        this.elements[i] = {
            datum: data[i],
            point: points ? points[i] : null,
            element: elements[i]
        };
        this.item2element.set(data[i], this.elements[i]);
    }
};

ChartElements.series.prototype.itemToString = function(item) {
    if(this.item_to_string) {
        return this.item_to_string(item);
    } else {
        return JSON.stringify(item);
    }
};

ChartElements.series.prototype.pointElementDistance = function(p, element) {
    if(element[0] == "rect") {
        return Geometry.pointRectDistance(p, element[1], element[2], element[4], element[3]);
    }
    if(element[0] == "circle") {
        var d = Geometry.pointPointDistance(p, element[1]);
        var d_border = Math.max(0, d - element[2]);
        return d_border;
    }
    return null;
};

ChartElements.series.prototype.isElementInsideLasso = function(lasso, element) {
    if(element[0] == "rect") {
        return Geometry.isPolygonIntersect([element[1], element[2], element[4], element[3]], lasso);
    }
    if(element[0] == "circle") {
        return Geometry.pointInsidePolygon(element[1], lasso)
    }
    return false;
};

ChartElements.series.prototype.getElementExtent = function(element) {
    if(element[0] == "rect") {
        return {
            type: "polyline",
            polyline: {
                closed: true,
                points: [element[1], element[2], element[4], element[3]]
            }
        };
    }
    if(element[0] == "circle") {
        return {
            type: "rect",
            rect: {
                x1: element[1].x - element[2],
                y1: element[1].y - element[2],
                x2: element[1].x + element[2],
                y2: element[1].y + element[2]
            }
        };
    }
};

ChartElements.series.prototype.getElementColor = function(element) {
    if(element[0] == "rect") {
        return element[5];
    }
    if(element[0] == "circle") {
        return element[3];
    }
};

ChartElements.series.prototype.getItemColor = function(item) {
    var element = this.item2element.get(item);
    if(element) {
        return this.getElementColor(element.element);
    } else {
        return null;
    }
};

ChartElements.series.prototype.getItemExtent = function(item) {
    var element = this.item2element.get(item);
    if(element) {
        return this.getElementExtent(element.element);
    } else {
        return null;
    }
};

ChartElements.series.prototype.selectAll = function() {
    return {
        elements: this,
        items: this.elements.map(function(d) { return d.datum; })
    };
};

ChartElements.series.prototype.select = function(p) {
    var min_distance = null;
    var min_element = null;
    this.elements.forEach(function(element) {
        var d = this.pointElementDistance(p, element.element);
        if(d === null) return;
        if(min_distance === null || min_distance > d) {
            min_element = element;
            min_distance = d;
        }
    }.bind(this));

    var min_segment_distance = null;
    var min_p1p2 = null;

    if(this.has_line) {
        for(var i = 0; i < this.elements.length - 1; i++) {
            var j = i + 1;
            var p1 = this.elements[i];
            var p2 = this.elements[j];
            var d = Geometry.pointLineSegmentDistance(p, p1.point, p2.point);
            if(min_segment_distance === null || min_segment_distance > d) {
                min_p1p2 = [p1, p2];
                min_segment_distance = d;
            }
        }
    }
    if (min_element && min_distance < 10) {
        return {
            distance: min_distance,
            element: min_element
        };
    } else if(min_p1p2 !== null && min_segment_distance < 10) {
        return {
            distance: min_segment_distance,
            segment: min_p1p2
        };
    } else if(min_p1p2 !== null && min_segment_distance < 40) {
        return {
            distance: min_segment_distance,
            is_whole_series: true,
            segment: [ this.elements[0], this.elements[this.elements.length - 1] ]
        };
    } else {
        return null;
    }
};

ChartElements.series.prototype.lassoSelect = function(lasso) {
    var selected_elements = this.elements.filter(function(element) {
        return this.isElementInsideLasso(lasso, element.element);
    }.bind(this));
    if(selected_elements.length != 0) {
        return {
            elements: selected_elements,
            is_lasso: true
        };
    }
};

ChartElements.series.prototype.getItemsWithLasso = function(lasso_selection) {
    return lasso_selection.elements.map(function(item) { return item.datum; });
};

ChartElements.series.prototype.render = function(g, selection) {
    var self = this;
    var elements = [];
    if(selection) {
        if(selection.elements) elements = selection.elements;
        if(selection.element) elements = [ selection.element ];
    }
    var sel_elements = g.selectAll(".element").data(elements);
    sel_elements.enter().append(function(d) {
        if(d.element[0] == "rect") {
            return document.createElementNS("http://www.w3.org/2000/svg", "path");
        }
        if(d.element[0] == "circle") {
            return document.createElementNS("http://www.w3.org/2000/svg", "circle");
        }
    }).attr("class", "element");
    sel_elements.exit().remove();
    sel_elements.each(function(d) {
        var sel_element = d3.select(this);
        if(d.element[0] == "rect") {
            sel_element.attr("d",
               "M" + d.element[1].x + "," + d.element[1].y +
               "L" + d.element[2].x + "," + d.element[2].y +
               "L" + d.element[4].x + "," + d.element[4].y +
               "L" + d.element[3].x + "," + d.element[3].y + "Z"
            );
        }
        if(d.element[0] == "circle") {
            sel_element.attr("cx", d.element[1].x);
            sel_element.attr("cy", d.element[1].y);
            sel_element.attr("r", d.element[2]);
        }
    });
    sel_elements.style({
        "fill": Colors.selection_hint_fill_color,
        "fill-opacity": 0.5,
        "stroke": Colors.selection_hint_color,
        "stroke-width": 2
    });
    if(this.itemToString) {
        var sel_elements_label = g.selectAll(".element-label").data(elements.length == 1 && !selection.is_lasso ? elements : []);
        var sel_elements_label_enter = sel_elements_label.enter().append("g").classed("element-label", true);
        sel_elements_label_enter.append("rect");
        sel_elements_label_enter.append("text");
        sel_elements_label.exit().remove();
        var yoffset = 10;
        var paddingx = 5, paddingy = 2;
        sel_elements_label.select("text").text(function(d) {
            return self.itemToString(d.datum);
        }).style({
            "fill": Colors.selection_hint_color,
            "stroke": "none",
            "font-size": "14",
            "text-anchor": "middle"
        });
        sel_elements_label.select("rect").style({
            "stroke": Colors.selection_hint_color,
            "fill": chroma.mix(Colors.selection_hint_color.toString(), "white", 0.9),
            "stroke-width": 1
        });
        sel_elements_label.each(function(d) {
            var sel_element = d3.select(this).select("text");
            if(d.element[0] == "rect") {
                sel_element.attr("x", (d.element[1].x + d.element[2].x + d.element[3].x + d.element[4].x) / 4);
                sel_element.attr("y", Math.min(d.element[1].y, d.element[2].y, d.element[3].y, d.element[4].y) - yoffset);
            }
            if(d.element[0] == "circle") {
                sel_element.attr("x", d.element[1].x);
                sel_element.attr("y", d.element[1].y - d.element[2] - yoffset);
            }
            var sel_element_bg = d3.select(this).select("rect");
            var bbox = sel_element.node().getBBox();
            sel_element_bg.attr({
                x: bbox.x - paddingx,
                y: bbox.y - paddingy,
                width: bbox.width + paddingx * 2,
                height: bbox.height + paddingy * 2
            });
        });

    }

    var segment_items = [];
    if(selection) {
        if(selection.segment) {
            var i1 = this.elements.indexOf(selection.segment[0]);
            var i2 = this.elements.indexOf(selection.segment[1]);
            segment_items = this.elements.slice(i1, i2 + 1);
            var path = g.append("path");
            path.attr("d", Geometry.Path.polyline.apply(null, segment_items.map(function(d) { return d.point; })));
            path.style({
                "fill": "none",
                "stroke": Colors.selection_hint_color,
                "stroke-width": 2
            });
        }
    }
};

ChartElements.series.prototype.getRangeItems = function(range, axis, mode) {
    if(!this.getAxisValue) return null;
    var getAxisValue = this.getAxisValue;
    var elements = this.elements.filter(function(element) {
        var value = getAxisValue(element.datum, axis.mode);
        if(!isArray(range) && isObject(range)) {
            // the "between" mode for categorical scale.
            if(mode == "above") return value >= range.max;
            if(mode == "below") return value <= range.min;
            if(mode == "above-or-equal") return value >= range.max;
            if(mode == "below-or-equal") return value <= range.min;
        }
        if(mode == "within-or-equal") return value >= range[0] && value <= range[1];
        if(mode == "without-or-equal") return value <= range[0] || value >= range[1];
        if(mode == "above-or-equal") return value >= range;
        if(mode == "below-or-equal") return value <= range;
        if(mode == "within") return value > range[0] && value < range[1];
        if(mode == "without") return value < range[0] || value > range[1];
        if(mode == "above") return value > range;
        if(mode == "below") return value < range;
    });
    return elements.map(function(d) { return d.datum; });
};

ChartElements.series.prototype.createLineHighlightOverlay = function(g, items, style) {
    var self = this;
    if(!isArray(items)) items = [ items ];
    var items = items.map(function(item) { return this.item2element.get(item); }.bind(this));

    if(this.has_line) {
        var lines = [];
        var current_idx = null;
        var current_line = null;
        var sorted_items = items.sort(function(a, b) {
            return self.elements.indexOf(a) - self.elements.indexOf(b);
        });
        for(var i = 0; i < sorted_items.length; i++) {
            var idx = this.elements.indexOf(sorted_items[i]);
            if(current_line === null) {
                current_line = [ sorted_items[i] ];
                current_idx = idx;
            } else {
                if(idx != current_idx + 1) {
                    lines.push(current_line);
                    current_line = [ sorted_items[i] ];
                    current_idx = idx;
                } else {
                    current_line.push(sorted_items[i]);
                    current_idx = idx;
                }
            }
        }
        if(current_line !== null) {
            lines.push(current_line);
        }
        var sel_lines = g.selectAll(".line-element").data(lines);
        sel_lines.enter().append("path").attr("class", "line-element");
        sel_lines.exit().remove();
        sel_lines.attr("d", function(d) {
            return Geometry.Path.polyline.apply(null, d.map(function(x) { return x.point; }));
        });
        sel_lines.style({
            "stroke": Styles.prepareHighlightColor(style.line_stroke, items.length > 0 ? self.getElementColor(items[0].element) : new RGBColor(0, 0, 0, 0)),
            "stroke-width": style.line_stroke_width,
            "fill": "none",
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            "pointer-events": "stroke"
        });
    }
    return g.selectAll("*");
};

ChartElements.series.prototype.createHighlightOverlay = function(g, items, style) {
    var self = this;
    if(!isArray(items)) items = [ items ];
    var items = items.map(function(item) { return this.item2element.get(item); }.bind(this));

    var sel_elements = g.selectAll(".element").data(items);
    sel_elements.enter().append(function(d) {
        if(d.element[0] == "rect") {
            return document.createElementNS("http://www.w3.org/2000/svg", "path");
        }
        if(d.element[0] == "circle") {
            return document.createElementNS("http://www.w3.org/2000/svg", "circle");
        }
    }).attr("class", "element");
    sel_elements.exit().remove();
    sel_elements.each(function(d) {
        var sel_element = d3.select(this);
        if(d.element[0] == "rect") {
            sel_element.attr("d",
               "M" + d.element[1].x + "," + d.element[1].y +
               "L" + d.element[2].x + "," + d.element[2].y +
               "L" + d.element[4].x + "," + d.element[4].y +
               "L" + d.element[3].x + "," + d.element[3].y + "Z"
            );
        }
        if(d.element[0] == "circle") {
            sel_element.attr("cx", d.element[1].x);
            sel_element.attr("cy", d.element[1].y);
            sel_element.attr("r", d.element[2]);
        }
    });
    if(style) {
        sel_elements.style({
            "fill": function(d) {
                return Styles.prepareHighlightColor(style.fill, self.getElementColor(d.element));
            },
            "stroke": function(d) {
                return Styles.prepareHighlightColor(style.stroke, self.getElementColor(d.element));
            },
            "stroke-width": style.stroke_width,
            "pointer-events": "all"
        });
        // Styles.applyStyle(style, sel_elements);
    }
    return g.selectAll("*");
};

ChartElements.series.prototype.createRangeHighlightOverlay = function(g, range, axis, mode, style) {
    return this.createHighlightOverlay(g, this.getRangeItems(range, axis, mode), style);
};
ChartElements.series.prototype.createRangeLineHighlightOverlay = function(g, range, axis, mode, style) {
    return this.createLineHighlightOverlay(g, this.getRangeItems(range, axis, mode), style);
};

ChartElements.series.prototype.beginCreation = function(layer_hint, selection, callback) {
    return {
        isClickOnly: true,
        mouseup: function() {
            if(selection.element) {
                var items = [ selection.element.datum ];
            } else if(selection.segment) {
                var i1 = this.elements.indexOf(selection.segment[0]);
                var i2 = this.elements.indexOf(selection.segment[1]);
                segment_items = this.elements.slice(i1, i2 + 1);
                var items = segment_items.map(function(d) { return d.datum; });
            } else {
                var items = [];
            }
            if((d3.event.ctrlKey || d3.event.shiftKey) && this.owner.addItemsToCurrentAnnotation([{ elements: this, items: items }])) {
                // Successfully added, do nothing and return.
                return;
            } else {
                callback(new Annotation({
                    target: {
                        type: "items",
                        items: [ {
                            elements: this,
                            items: items
                        } ]
                    },
                    components: [
                        {
                            visible: selection.is_whole_series ? false: true,
                            type: "item-label",
                            text: Expression.parse(this.default_label ? this.default_label : '"[edit]"'),
                            anchor: "m,tt",
                            style: Styles.createDefault("item-label")
                        },
                        {
                            type: "highlight",
                            style: Styles.createDefault("highlight"),
                            segment: selection.segment
                        }
                    ]
                }));
            }
        }.bind(this)
    };
};

ChartElements.legend = function(owner, info) {
    this.owner = owner;
    this.name = info.name;
    this.elements = [];
    this.bubbleset = info.bubbleset;
    this.default_label = info.default_label;
    this.default_label_mode = info.default_label_mode;
};

ChartElements.legend.prototype.setItems = function(items) {
    this.elements = items.map(function(d) {
        return {
            items: d.items,
            name: d.name,
            rect: d.rect,
            color: d.color
        };
    });
};

ChartElements.legend.prototype.select = function(p) {
    var min_distance = null, min_element;
    for(var i = 0; i < this.elements.length; i++) {
        var rect = this.elements[i].rect;
        var d = Geometry.pointRectDistance(p, rect[0], rect[1], rect[3], rect[2]);
        if(min_distance === null || d < min_distance) {
            min_distance = d;
            min_element = this.elements[i];
        }
    }
    if(min_distance !== null && min_distance < 10) {
        return {
            distance: min_distance,
            element: min_element
        };
    } else {
        return null;
    }
};

ChartElements.legend.prototype.render = function(g, selection) {
    if(!selection) return;
    var rect = selection.element.rect;
    var sel_elements = g.selectAll("path").data([ rect ]);
    sel_elements.enter().append("path");
    sel_elements.exit().remove();
    sel_elements.attr("d", function(r) {
        return Geometry.Path.polylineClosed(r[0], r[1], r[3], r[2]);
    });
    sel_elements.style({
        "fill": Colors.selection_hint_fill_color,
        "fill-opacity": 0.1,
        "stroke": Colors.selection_hint_color,
        "stroke-width": 2
    });
};

ChartElements.legend.prototype.beginCreation = function(layer_hint, selection, callback) {
    return {
        isClickOnly: true,
        mouseup: function() {
            var element = selection.element;
            var default_label_mode = "item-label";
            var components = [
                {
                    type: default_label_mode == "item-label" ? "item-label" : "label",
                    text: default_label_mode == "label" ? new Expression.String(element.name) : Expression.parse("value"),
                    visible: true,
                    anchor: "m,tt",
                    style: Styles.createDefault(default_label_mode == "item-label" ? "item-label" : "label")
                },
                {
                    type: "highlight",
                    style: Styles.createDefault("highlight"),
                    segment: selection.segment
                }
            ];

            if(this.bubbleset !== undefined) {
                var bubbleset = {
                    visible: this.bubbleset == "default-on",
                    type: "bubbleset",
                    visible: false,
                    style: Styles.createDefault("bubbleset")
                };
                if(element.color) {
                    bubbleset.style.fill = element.color.clone();
                    bubbleset.style.fill.a = 0.5;
                }
                components.push(bubbleset);
            }
            var target_items = element.items.map(function(item) {
                return {
                    elements: this.owner.chart_elements.filter(function(d) { return d.name == item.series; })[0],
                    items: item.items.slice()
                }
            }.bind(this));

            if((d3.event.ctrlKey || d3.event.shiftKey) && this.owner.addItemsToCurrentAnnotation(target_items)) {
                // Successfully added, do nothing and return.
                return;
            } else {
                callback(new Annotation({
                    target: {
                        type: "items",
                        items: target_items
                    },
                    components: components
                }));
            }
        }.bind(this)
    };
};


var BubbleCursorManager = function(svg, reference_element) {
    this.reference_element = reference_element;
    this.items = [];
    this.CreateSVGPoint = function(x, y) {
        var p = svg.createSVGPoint();
        p.x = x;
        p.y = y;
        return p;
    };
};

BubbleCursorManager.prototype.addElement = function(root_matrix_inverse, element, cursor, onmousedown) {
    var self = this;
    var tag = element.tagName;
    if(tag == "rect") {
        var matrix = element.getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        var x = parseFloat(element.getAttribute("x"));
        var y = parseFloat(element.getAttribute("y"));
        var w = parseFloat(element.getAttribute("width"));
        var h = parseFloat(element.getAttribute("height"));
        var p00 = this.CreateSVGPoint(x, y).matrixTransform(matrix);
        var p01 = this.CreateSVGPoint(x, y + h).matrixTransform(matrix);
        var p10 = this.CreateSVGPoint(x + w, y).matrixTransform(matrix);
        var p11 = this.CreateSVGPoint(x + w, y + h).matrixTransform(matrix);
        this.items.push([["rect", p00, p01, p10, p11], cursor, onmousedown]);
    }
    if(tag == "circle") {
        var matrix = element.getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        var cx = parseFloat(element.getAttribute("cx"));
        var cy = parseFloat(element.getAttribute("cy"));
        var r = parseFloat(element.getAttribute("r"));
        var center = this.CreateSVGPoint(cx, cy).matrixTransform(matrix);
        var radius = matrix.a * r;
        this.items.push([["circle", center, radius], cursor, onmousedown]);
    }
    if(tag == "path") {
        var matrix = element.getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        var d = element.getAttribute("d");
        d = d.split(/\s*[ml]\s*/i).map(function(x) { return x.trim().split(/\s*,\s*/).map(function(y) { return parseFloat(y.trim()); }); }).filter(function(x) { return x.length == 2; });
        d = d.map(function(p) {
            return self.CreateSVGPoint(p[0], p[1]).matrixTransform(matrix);
        });
        this.items.push([["polygon", d], isObject(cursor) ? cursor : { cursor: cursor, layer: 0 }, onmousedown]);
    }
};

BubbleCursorManager.prototype.add = function(selection, cursor, onmousedown) {
    var self = this;
    var root_matrix = this.reference_element.getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();
    selection.each(function() {
        self.addElement(root_matrix_inverse, this, cursor, onmousedown);
    });
};

BubbleCursorManager.prototype.clear = function() {
    this.items = [];
};

BubbleCursorManager.prototype.pointItemDistance = function(p, element) {
    if(element[0] == "rect") {
        return Geometry.pointRectDistance(p, element[1], element[2], element[4], element[3]);
    }
    if(element[0] == "circle") {
        var d = Geometry.pointPointDistance(p, element[1]);
        var d_border = Math.max(0, d - element[2]);
        return d_border;
    }
    if(element[0] == "polygon") {
        var d = Geometry.pointInsidePolygon(p, element[1]);
        return d ? 0 : 1000;
    }
    return null;
};


BubbleCursorManager.prototype.find = function(pt) {
    var dmin = null, imin = null;
    for(var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        var d = this.pointItemDistance(pt, item[0]);
        if(d === null) continue;
        if(dmin === null || (dmin > d || (dmin == d && this.items[imin][1].layer < this.items[i][1].layer))) {
            dmin = d;
            imin = i;
        }
    }
    if(imin !== null && dmin < 3) {
        var info = this.items[imin][1];
        return {
            cursor: info.cursor,
            layer: info.layer,
            onmousedown: this.items[imin][2],
            distance: dmin
        };
    } else {
        return null;
    }
};


var ChartRepresentation = function(owner, info) {
    var self = this;

    this.owner = owner;

    this.undo_history = [];
    this.redo_history = [];

    this.layer_annotation = owner.layer_annotation.append("g")
    .attr("transform", "translate(" + info.bounds.origin_x + "," + info.bounds.origin_y + ")");

    this.layer_background = owner.layer_background.append("g")
    .attr("transform", "translate(" + info.bounds.origin_x + "," + info.bounds.origin_y + ")");

    if(owner.panel) {
        this.panel = owner.panel.append("chartaccent-panel");

        this.panel.append("header").call(IconFont.addIcon("shape-image1")).append("span").text(" ChartAccent");
        this.panel_controls = this.panel.append("section").classed("controls", true);

        this.panel_controls_tree = appendTreeOnce(this.panel_controls.append("p"), [
            [ "p", [
                [ "span.btn", { $: "btn_undo", classed: { "btn-toggle": true, "chartaccent-export-button": true }, text: "Undo" } ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "btn_redo", classed: { "btn-toggle": true, "chartaccent-export-button": true }, text: "Redo" } ]
                // [ "span", { text: " " } ],
                // [ "span.btn", { $: "btn_reset", classed: { "btn-toggle": true, "chartaccent-export-button": true }, text: "Reset" } ]
            ]]
        ]);

        this.panel.append("header").call(IconFont.addIcon("shape-image")).append("span").text(" Labels and Shapes");
        this.panel_shapes = this.panel.append("section").classed("shapes", true);

        this.panel_shapes_tree = appendTreeOnce(this.panel_shapes.append("p"), [
            [ "p", [
                [ "span.btn", { $: "add_line", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-line") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_arrow", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-arrow") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_oval", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-oval") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_rect", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-rect") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_text", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-label") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_image", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-image") ] ],
                [ "span", { text: " " } ],
                [ "input", { $: "input_file", attr: { type: "file" }, style: { display: "none" } } ]
                // [ "span.btn", { $: "export_image", classed: { "btn-toggle": true, "chartaccent-export-button": true }, text: "Export" } ]
                // [ "span.btn", { $: "export_image_svg", classed: { "btn-toggle": true, "chartaccent-export-button": true }, text: "ExportSVG" } ]
            ]]
        ]);
        var input_file_node = this.panel_shapes_tree.input_file.node();

        self.panel_controls_tree["btn_undo"].on("click", function() {
            self.undo();
        });
        self.panel_controls_tree["btn_redo"].on("click", function() {
            self.redo();
        });
        if(self.panel_controls_tree["btn_reset"]) {
            self.panel_controls_tree["btn_reset"].on("click", function() {
                self.reset();
            });
        }

        ["line", "text", "arrow", "rect", "oval", "image"].forEach(function(type) {
            self.panel_shapes_tree["add_" + type].on("click", function(d) {
                if(type == "image") {
                    input_file_node.value = "";
                    input_file_node.onchange = function() {
                        var file = input_file_node.files[0];
                        if(!file) return;
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var content = e.target.result;
                            self.current_creating_image = content;
                            self.current_creating_shape = "image";
                            self.rect_interaction.style("cursor", "crosshair");
                            self.panel_shapes_tree["add_" + type].classed("active", true);
                        }
                        reader.readAsDataURL(file);
                    };
                    input_file_node.click();
                } else {
                    self.current_creating_shape = type;
                    self.rect_interaction.style("cursor", "crosshair");
                    self.panel_shapes_tree["add_" + type].classed("active", true);
                }
            });
        });

        if(this.panel_shapes_tree.export_image) {
            this.panel_shapes_tree.export_image.on("click", function() {
                self.owner.getImageDataURL("image/png", 4, function(url) {
                    var a = d3.select("body").append("a").attr("href", url).attr("target", "_blank").attr("download", self.owner.export_name ? self.owner.export_name : "chart-accent.png");
                    a.node().click();
                    a.remove();
                });
            });
        }
        // this.panel_shapes_tree.export_image_svg.on("click", function() {
        //     var url = self.owner.getSVGDataURL();
        //     var a = d3.select("body").append("a").attr("href", url).attr("target", "_blank").attr("download", self.owner.export_name ? self.owner.export_name : "chart-accent.png");
        //     a.node().click();
        //     a.remove();
        // });
        // MakeSingleSelectButton(this.panel_shapes_tree.add_shape, "Add Shape", [
        //     { name: "Arrow", value: "arrow" },
        //     { name: "Rectangle", value: "rect" },
        //     { name: "Image", value: "image" }
        // ], function(value) {
        //     self.current_creating_shape = value;
        //     self.panel_shapes_tree.add_shape.select("span.btn").classed("active", true);
        // }, null);


        this.panel.append("header").call(IconFont.addIcon("annotation")).append("span").text(" Annotations");
        this.panel_annotations = this.panel.append("section").classed("annotations", true);
        this.panel.append("header").call(IconFont.addIcon("edit")).append("span").text(" Editor");
        this.panel_editor = this.panel.append("section").classed("editor", true);
    }

    this.createSVGDefs(this.layer_annotation);

    if(info.palette) {
        this.palette = info.palette.map(function(d) { return new RGBColor(d); });
    }

    var rect_interaction = this.layer_annotation.append("rect")
    .attr({
        x: info.bounds.x - info.bounds.origin_x,
        y: info.bounds.y - info.bounds.origin_y,
        width: info.bounds.width,
        height: info.bounds.height
    })
    .style({
        "fill": "none",
        "stroke": "#CCC",
        "stroke-width": "1",
        "pointer-events": "all"
    });

    this.rect_interaction = rect_interaction;

    rect_interaction
    .on("mousemove", function() {
        if(!self.is_creating) {
            self._RenderHint(d3.event.clientX, d3.event.clientY);
        }
        // d3.select(this).style("stroke-width", 3);
    })
    // .on("mouseover", function() {
    //     if(!self.is_creating) {
    //         self._RenderHint(d3.event.clientX, d3.event.clientY);
    //     }
    // })
    .on("mouseout", function() {
        if(!self.is_creating) {
            self._RenderHint();
        }
        // d3.select(this).style("stroke-width", 1);
    })
    .on("mousedown", function() {
        self._BeginCreation(d3.event.clientX, d3.event.clientY);
    });

    this.layers = {
        bg2: this.layer_background.append("g"),
        bg: this.layer_background.append("g"),
        fg: this.layer_annotation.append("g"),
        fg2: this.layer_annotation.append("g"),
        owner2id: new Map(),
        add: function(layer, owner, type, classname, unique_id) {
            var make_last_child = function(sel) {
                sel.node().parentNode.appendChild(sel.node());
                return sel;
            }
            var id = getObjectUniqueID(owner);
            this.owner2id.set(owner, id);
            if(!unique_id) {
                if(!classname) {
                    var sel = this[layer].select(type + "." + id);
                    if(!sel.empty()) return make_last_child(sel);
                    return this[layer].append(type).classed(id, true);
                } else {
                    var sel = this[layer].select(type + "." + id + "." + classname);
                    if(!sel.empty()) return make_last_child(sel);
                    return this[layer].append(type).classed(id, true).classed(classname, true);
                }
            } else {
                if(!classname) {
                    var sel = this[layer].select(type + "." + id + '[data-cauid="' + unique_id + '"]');
                    if(!sel.empty()) return make_last_child(sel);
                    return this[layer].append(type).classed(id, true).attr("data-cauid", unique_id);
                } else {
                    var sel = this[layer].select(type + "." + id + "." + classname + '[data-cauid="' + unique_id + '"]');
                    if(!sel.empty()) return make_last_child(sel);
                    return this[layer].append(type).classed(id, true).classed(classname, true).attr("data-cauid", unique_id);
                }
            }
        },
        getAll: function(layer, owner) {
            var id = this.owner2id.get(owner);
            if(id) {
                return this[layer].selectAll("." + id);
            } else {
                return null;
            }
        },
        cleanup: function(owners) {
            var set = new Set(owners);
            this.owner2id.forEach(function(id, obj) {
                if(!set.has(obj)) {
                    this.bg2.selectAll("." + id).remove();
                    this.bg.selectAll("." + id).remove();
                    this.fg.selectAll("." + id).remove();
                    this.fg2.selectAll("." + id).remove();
                    this.owner2id.delete(obj);
                }
            }.bind(this));
        }
    };

    this.layer_hint = this.layer_annotation.append("g")
        .style({
            "pointer-events": "none"
        });

    this.bounds = info.bounds;
    this.default_lasso_label = info.default_lasso_label == "per-item" ? "item-label" : "label";
    this.default_lasso_label_expression = info.default_lasso_label_expression;

    this.default_lasso_label = "item-label";
    this.default_lasso_label_expression = 'value';

    var context_items = { };
    if(info.tables) {
        info.tables.forEach(function(table) {
            context_items[table.name] = table.data;
            if(table.isDefault) context_items["data"] = table.data;
        });
    }

    // Chart specific functions.
    context_items.annotation = function(args, kwargs) {
        var a = self.getAnnotationByID(args[0]);
        return a;
    };

    this.context = Expression.CreateContext(context_items);

    if(info.cartesian_scales) {
        this.cartesian_scales = info.cartesian_scales;
        this.coordinate_system = "cartesian";
    }

    if(info.selection_mode) {
        this.selection_mode = info.selection_mode;
    } else {
        this.selection_mode = "marquee";
    }

    this.rendered_annotations = {
        validate: function() {
            self._RenderAnnotations();
        }
    };
    this.render_context = {
        owner: this,
        context: self.context,
        layers: self.layers,
        isEditing: true,
        validate: function() {
            DM.validate(self.rendered_annotations);
        },
        removeAnnotation: function(annotation) {
            self.removeAnnotation(annotation)
        },
        hasSelection: function() {
            return !!self.editing_annotation;
        },
        isSelected: function(annotation) {
            return self.editing_annotation == annotation;
        },
        isSelectionInAnnotation: function(annotation) {
            if(!self.editing_annotation) return false;
            if(self.editing_annotation == annotation) return true;
            function getItems(annotation) {
                var result = new Set();
                annotation.forEachElementsItem(self.render_context, function(elements, item) {
                    result.add(item);
                });
                return result;
            }
            var editing_items = getItems(self.editing_annotation);
            var annotation_items = getItems(annotation);
            // console.log(editing_items, annotation_items);
            return Array.from(editing_items).every(function(item) {
                return annotation_items.has(item);
            });
        },
        addBubbleCursorItems: function(selection, cursor, onmousedown) {
            self._addBubbleCursorItems(selection, cursor, onmousedown);
        }
    };

    this.tables = info.tables;
    this.annotations = [];
    this.annotations_idmap = new Map();
    this.chart_elements = [];
    this.bubble_cursor_items = new BubbleCursorManager(this.owner.svg, this.layer_annotation.node());

    this.setEditingAnnotation(null);
    this._RenderAnnotations();
};

ChartRepresentation.prototype.CreateSVGPoint = function(x, y) {
    var p = this.owner.svg.createSVGPoint();
    p.x = x; p.y = y;
    return p;
};

ChartRepresentation.prototype._clearBubbleCursorItems = function() {
    this.bubble_cursor_items.clear();
};
ChartRepresentation.prototype._addBubbleCursorItems = function(selection, cursor, onmousedown) {
    this.bubble_cursor_items.add(selection, cursor, onmousedown);
};

ChartRepresentation.prototype._RenderHint = function(x, y) {
    this.layer_hint.selectAll("*").remove();
    if(x === undefined || y === undefined) return;
    if(this.current_creating_shape) {
        return;
    }

    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();
    var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);

    var min_s = null;
    this.chart_elements.forEach(function(content) {
        var s = content.select(pt);
        if(s) {
            if(min_s === null || min_s.selection.distance > s.distance) {
                min_s = { content: content, selection: s };
            }
        }
    });

    var min_b = this.bubble_cursor_items.find(pt);
    if(min_s && min_b) {
        if(min_b.distance < min_s.selection.distance || min_b.distance == min_s.selection.distance && min_b.layer > 0) {
            min_s = null;
        } else {
            min_b = null;
        }
    }

    if(min_s) {
        min_s.content.render(this.layer_hint, min_s.selection)
        this.current_selection = min_s;
        this.rect_interaction.style("cursor", "pointer");
    } else {
        this.current_selection = null;
        this.rect_interaction.style("cursor", "default");
    }
    if(min_b) {
        this.current_selection = null;
        this.rect_interaction.style("cursor", min_b.cursor ? min_b.cursor : "default");
    }
};

ChartRepresentation.prototype._BeginCreationShape = function(shape, x, y) {
    var self = this;
    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();
    var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
    var pt0 = pt;

    if(shape == "text") {
        var render_hint = function(p1, p2) {
            appendOnlyOnce(self.layer_hint, "rect")
                .attr("x", Math.min(p1.x, p2.x)).attr("y", Math.min(p1.y, p2.y))
                .attr("width", Math.abs(p1.x - p2.x)).attr("height", Math.abs(p1.y - p2.y))
                .style({
                    "stroke-width": 2,
                    "stroke": Colors.selection_hint_color,
                    "fill": Colors.selection_hint_color,
                    "fill-opacity": 0.2
                });
        };
        var do_create = function(p1, p2, is_moved) {
            if(!is_moved) {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        point: { x: p2.x, y: p2.y }
                    },
                    components: [
                        { type: "label",
                          _show_expression_editor: true,
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        }
                    ]
                }));
            } else {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        rect: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
                    },
                    components: [
                        { visible: true,
                          _show_expression_editor: true,
                          type: "label",
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        },
                        { type: "shape.rect",
                          style: Styles.createDefault("shape.rect")
                        }
                    ]
                }));
            }
        };
    }
    if(shape == "rect" || shape == "oval" || shape == "image") {
        var render_hint = function(p1, p2) {
            if(shape == "oval") {
                appendOnlyOnce(self.layer_hint, "ellipse")
                    .attr("cx", (p1.x + p2.x) / 2).attr("cy", (p1.y + p2.y) / 2)
                    .attr("rx", Math.abs(p1.x - p2.x) / 2).attr("ry", Math.abs(p1.y - p2.y) / 2)
                    .style({
                        "stroke-width": 2,
                        "stroke": Colors.selection_hint_color,
                        "fill": Colors.selection_hint_color,
                        "fill-opacity": 0.2
                    });
            } else {
                appendOnlyOnce(self.layer_hint, "rect")
                    .attr("x", Math.min(p1.x, p2.x)).attr("y", Math.min(p1.y, p2.y))
                    .attr("width", Math.abs(p1.x - p2.x)).attr("height", Math.abs(p1.y - p2.y))
                    .style({
                        "stroke-width": 2,
                        "stroke": Colors.selection_hint_color,
                        "fill": Colors.selection_hint_color,
                        "fill-opacity": 0.2
                    });
            }
        };
        var do_create = function(p1, p2) {
            if(shape == "rect") {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        rect: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
                    },
                    components: [
                        { visible: false,
                          type: "label",
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        },
                        { type: "shape.rect",
                          style: Styles.createDefault("shape.rect")
                        }
                    ]
                }));
            }
            if(shape == "oval") {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        rect: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
                    },
                    components: [
                        { visible: false,
                          type: "label",
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        },
                        { type: "shape.oval",
                          style: Styles.createDefault("shape.oval")
                        }
                    ]
                }));
            }
            if(shape == "image") {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        rect: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
                    },
                    components: [
                        { visible: false,
                          type: "label",
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        },
                        { type: "shape.image",
                          image: self.current_creating_image,
                          opacity: 1.0
                        }
                    ]
                }));
            }
        };
    }
    if(shape == "arrow" || shape == "line") {
        var render_hint = function(p1, p2) {
            appendOnlyOnce(self.layer_hint, "line")
                .attr("x1", p1.x).attr("y1", p1.y)
                .attr("x2", p2.x).attr("y2", p2.y)
                .style({
                    "stroke-width": 2,
                    "stroke": Colors.selection_hint_color,
                    "fill": "none"
                });
        };
        var do_create = function(p1, p2) {
            if(!p1 || !p2 || (p1.x == p2.x && p1.y == p2.y)) return;
            self.addAnnotation(new Annotation({
                target: {
                    type: "freeform",
                    line: [
                        { x: p1.x, y: p1.y },
                        { x: p2.x, y: p2.y }
                    ]
                },
                components: [
                    { type: "shape.line",
                      style: Styles.createDefault("shape.line"),
                      arrow: shape == "line" ? "" : ">",
                      arrow_size: 5
                    }
                ]
            }));
        };
    }

    this.is_creating = true;
    var is_moved = false;
    setupDragHandlers({
        mousemove: function() {
            var x = d3.event.clientX;
            var y = d3.event.clientY;
            var root_matrix = this.layer_annotation.node().getScreenCTM();
            var root_matrix_inverse = root_matrix.inverse();
            var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
            is_moved = true;
            render_hint(pt0, pt);
        }.bind(this),
        mouseup: function() {
            var x = d3.event.clientX;
            var y = d3.event.clientY;
            var root_matrix = this.layer_annotation.node().getScreenCTM();
            var root_matrix_inverse = root_matrix.inverse();
            var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
            this.is_creating = false;
            this.layer_hint.selectAll("*").remove();
            this.panel_shapes_tree.add_text.classed("active", false);
            this.panel_shapes_tree.add_rect.classed("active", false);
            this.panel_shapes_tree.add_oval.classed("active", false);
            this.panel_shapes_tree.add_line.classed("active", false);
            this.panel_shapes_tree.add_arrow.classed("active", false);
            this.panel_shapes_tree.add_image.classed("active", false);
            do_create(pt0, pt, is_moved);
        }.bind(this)
    });
};

ChartRepresentation.prototype._BeginCreation = function(x, y) {
    this.layer_hint.selectAll("*").remove();
    if(x === undefined || y === undefined) return;

    if(this.current_creating_shape) {
        var shape = this.current_creating_shape;
        this.current_creating_shape = undefined;
        return this._BeginCreationShape(shape, x, y);
    }

    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();
    var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
    var pt0 = pt;

    var min_s = null;
    this.chart_elements.forEach(function(content) {
        var s = content.select(pt);
        if(s) {
            if(min_s === null || min_s.selection.distance > s.distance) {
                min_s = { content: content, selection: s };
            }
        }
    });
    var min_b = this.bubble_cursor_items.find(pt);
    if(min_s && min_b) {
        if(min_b.distance < min_s.selection.distance || min_b.distance == min_s.selection.distance && min_b.layer > 0) {
            min_s = null;
        } else {
            min_b = null;
        }
    }
    if(min_s && min_s.content.beginCreation) {
        var context = min_s.content.beginCreation(this.layer_hint, min_s.selection, function(annotation) {
            this.addAnnotationIfFoundSelect(annotation);
        }.bind(this));
    } else {
        var lasso = [ pt0 ];
    }
    if(min_b) {
        min_b.onmousedown();
        return;
    }


    // var lasso_enforce_rectangle = this.selection_mode == "marquee";
    var lasso_enforce_rectangle = !d3.event.altKey;

    var lasso_path = null;
    var lasso_g = null;
    var render_lasso = function() {
        if(lasso.length >= 2) {
            if(!lasso_path) {
                lasso_g = this.layer_hint.append("g");
                lasso_path = this.layer_hint.append("path");
            }
            lasso_path.style({
                "stroke": Colors.selection_hint_color,
                "fill": Colors.selection_hint_color,
                "fill-opacity": 0.1,
                "stroke-width": 2,
                "stroke-linejoin": "round"
            });
            var lasso_shape = lasso;
            if(lasso_enforce_rectangle) {
                var l = lasso.length - 1;
                lasso_shape = [
                    new Geometry.Vector(lasso[0].x, lasso[0].y),
                    new Geometry.Vector(lasso[0].x, lasso[l].y),
                    new Geometry.Vector(lasso[l].x, lasso[l].y),
                    new Geometry.Vector(lasso[l].x, lasso[0].y)
                ];
            }
            lasso_path.attr("d", Geometry.Path.polylineClosed.apply(Geometry.Path, lasso_shape));
            this.chart_elements.forEach(function(elements) {
                if(elements.lassoSelect) {
                    var selection = elements.lassoSelect(lasso_shape);
                    var sel = lasso_g.selectAll("g." + getObjectUniqueID(elements)).data(selection ? [ 0 ] : []);
                    sel.enter().append("g").attr("class", getObjectUniqueID(elements));
                    sel.exit().remove();
                    if(selection) {
                        elements.render(sel, selection);
                    }
                }
            }.bind(this));
        }
    }.bind(this);

    var lasso_selection = function() {
        var lasso_shape = lasso;
        if(lasso_enforce_rectangle) {
            var l = lasso.length - 1;
            lasso_shape = [
                new Geometry.Vector(lasso[0].x, lasso[0].y),
                new Geometry.Vector(lasso[0].x, lasso[l].y),
                new Geometry.Vector(lasso[l].x, lasso[l].y),
                new Geometry.Vector(lasso[l].x, lasso[0].y)
            ];
        }
        var target_items = [];
        this.chart_elements.forEach(function(elements) {
            if(elements.lassoSelect) {
                var selection = elements.lassoSelect(lasso_shape);
                if(selection && elements.getItemsWithLasso) {
                    var items = elements.getItemsWithLasso(selection);
                    if(items.length > 0) {
                        target_items.push({
                            elements: elements,
                            items: items
                        });
                    }
                }
            }
        }.bind(this));
        if(target_items.length > 0) {
            if(this.addItemsToCurrentAnnotation(target_items)) {
                return;
            }
            if(target_items.length == 1 && target_items[0].items.length == 1) {
                var new_annotation = new Annotation({
                    target: {
                        type: "items",
                        items: target_items
                    },
                    components: [
                        {
                            type: "item-label",
                            text: Expression.parse(this.default_lasso_label_expression ? this.default_lasso_label_expression : "value"),
                            anchor: "m,tt",
                            style: Styles.createDefault("item-label")
                        },
                        {
                            type: "highlight",
                            style: Styles.createDefault("highlight")
                        }
                    ]
                });
            } else {
                var bubbleset_enabled = target_items.every(function(d) {
                    return d.elements.bubbleset !== undefined;
                });
                var bubbleset_on = bubbleset_enabled && target_items.some(function(d) {
                    return d.elements.bubbleset == "default-on";
                });
                var components = [
                    {
                        type: this.default_lasso_label,
                        text: this.default_lasso_label == "label" ? Expression.parse('"Group"') : Expression.parse(this.default_lasso_label_expression ? this.default_lasso_label_expression : "value"),
                        anchor: "m,tt",
                        style: Styles.createDefault(this.default_lasso_label)
                    },
                    {
                        type: "highlight",
                        style: Styles.createDefault("highlight")
                    }
                ];
                if(bubbleset_enabled) {
                    components.push({
                        visible: false,
                        type: "bubbleset",
                        style: Styles.createDefault("bubbleset")
                    });
                }
                var new_annotation = new Annotation({
                    target: {
                        type: "items",
                        items: target_items
                    },
                    components: components
                });
            }
            this.addAnnotationIfFoundSelect(new_annotation);
        }
    }.bind(this);

    this.is_creating = true;
    setupDragHandlers({
        mousemove: function() {
            var x = d3.event.clientX;
            var y = d3.event.clientY;
            var root_matrix = this.layer_annotation.node().getScreenCTM();
            var root_matrix_inverse = root_matrix.inverse();
            var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
            if(!lasso && context && context.isClickOnly) {
                // Mouse moved but context only accept clicks, switch to lasso.
                lasso = [ pt0 ];
                context = null;
            }
            if(context) {
                if(context.mousemove) context.mousemove(pt);
            }
            if(lasso) {
                lasso.push(pt);
                render_lasso();
            }
        }.bind(this),
        mouseup: function() {
            var x = d3.event.clientX;
            var y = d3.event.clientY;
            var root_matrix = this.layer_annotation.node().getScreenCTM();
            var root_matrix_inverse = root_matrix.inverse();
            var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
            if(context) {
                if(context.mouseup) context.mouseup(pt);
            }
            if(lasso) {
                lasso_selection();
                if(lasso_path) lasso_path.remove();
                if(lasso_g) lasso_g.remove();
            }
            this.is_creating = false;
            this.layer_hint.selectAll("*").remove();
        }.bind(this)
    });
};

ChartRepresentation.prototype._RenderAnnotations = function() {
    var self = this;
    this._clearBubbleCursorItems();
    self.layers.cleanup(this.annotations);

    this.annotations.forEach(function(annotation) {
        try {
            annotation.render(self.render_context);
        } catch(e) {
            console.log(e.stack);
        }
    });

    this.chart_elements.forEach(function(element) {
        if(element.renderGuides) element.renderGuides(self.render_context);
    });

    this._RenderAnnotationList();

    this.saveStateForUndo();
};
ChartRepresentation.prototype._RenderAnnotationList = function() {
    var self = this;
    var non_freeform_annotations = this.annotations.filter(function(d) {
        return d.target.type != "freeform";
    });

    if(!this.panel) return;

    var sel_nothing = this.panel_annotations.selectAll("p.nothing").data(non_freeform_annotations.length == 0 ? [ 0 ] : []);
    sel_nothing.enter().append("p").attr("class", "nothing").text("(none)");
    sel_nothing.exit().remove();


    var divs = appendOnlyOnce(this.panel_annotations, "div").selectAll("div.annotation").data(non_freeform_annotations);
    divs.enter().append("div").attr("class", "annotation");
    divs.exit().remove();

    divs.on("mousedown", function(my_annotation, my_index) {
        self.setEditingAnnotation(my_annotation);
        var existing_list = self.annotations.slice();
        var bounds = [];
        divs.each(function(annotation, index) {
            var rect = this.getBoundingClientRect();
            bounds.push([ annotation, rect.top, rect.bottom ]);
        });
        setupDragHandlers({
            mousemove: function() {
                var dist_min = null, index_min = null;
                var index_min = null;
                var y_cursor = d3.event.clientY;
                bounds.forEach(function(d, index) {
                    if(dist_min === null || Math.abs(y_cursor - d[1]) < dist_min) {
                        dist_min = Math.abs(y_cursor - d[1]);
                        index_min = index;
                    }
                    if(dist_min === null || Math.abs(y_cursor - d[2]) < dist_min) {
                        dist_min = Math.abs(y_cursor - d[2]);
                        index_min = index + 1;
                    }
                });

                if(index_min !== null && index_min != my_index && index_min != my_index + 1) {
                    var index = index_min;
                    self.annotations = existing_list.slice();
                    var idx_remove = self.annotations.indexOf(my_annotation);
                    self.annotations.splice(index, 0, my_annotation);
                    if(index < idx_remove) idx_remove += 1;
                    self.annotations.splice(idx_remove, 1);
                    DM.invalidate(self.rendered_annotations);
                    DM.validate(self.rendered_annotations);
                } else {
                    self.annotations = existing_list.slice();
                    DM.invalidate(self.rendered_annotations);
                    DM.validate(self.rendered_annotations);
                }
            },
            mouseup: function() {

            }
        });
    });
    divs.classed("active", function(d) { return self.editing_annotation == d; });
    var left = appendOnlyOnce(divs, "div", "left");
    var btn_eye = appendOnlyOnce(left, "span", "btn").call(IconFont.addIconOnce(function(d) {
        return d.visible ? "correct" : "blank";
    }));
    var right = appendOnlyOnce(divs, "div", "right");
    var btn_remove = appendOnlyOnce(right, "span", "btn").classed("btn-danger", false).call(IconFont.addIconOnce("cross"));
    var label = appendOnlyOnce(divs, "label");
    appendOnlyOnce(left, "span", "icon").call(IconFont.addIconOnce("edit")).style("display", function(d) {
        return self.editing_annotation == d ? null : "none";
    });
    appendOnlyOnce(label, "span", "text").text(function(d) {
        return " " + d.toString();
    });
    btn_eye.classed("active", function(d) { return d.visible; });
    btn_eye.on("mousedown", function(d) {
        d3.event.stopPropagation();
    });
    btn_eye.on("click", function(d) {
        d3.event.stopPropagation();
        d.visible = !d.visible;
        DM.invalidate(d);
        DM.validate(self.rendered_annotations);
    });
    btn_remove.on("mousedown", function(d) {
        d3.event.stopPropagation();
    });
    btn_remove.on("click", function(d) {
        d3.event.stopPropagation();
        self.removeAnnotation(d);
    });
    // divs.on("click", function(d) {
    //     self.setEditingAnnotation(d);
    // });

    if(this.editing_annotation) {
        this.editing_annotation.startPopoutEditor(this.render_context);
    } else {
        d3.select("body .chartaccent-selection-box").remove();
        this.panel_editor.selectAll("*").remove();
        this.panel_editor.append("p").classed("nothing", true).text("(select an annotation to edit)");
    }
};
ChartRepresentation.prototype.setEditingAnnotation = function(annotation) {
    var self = this;

    if(!annotation) {
        this.editing_annotation = undefined;
    } else {
        this.editing_annotation = annotation;
    }
    this._should_ignore_undo_log = true;
    this._RenderAnnotations();
    this._should_ignore_undo_log = false;

    var is_event_target_in_panel_or_editing_widget = function(target) {
        var result = false;
        var item = target;
        while(item && item != document.body && item != document) {
            if(item == self.panel.node()) {
                result = true;
                break;
            }
            if(d3.select(item).classed("chartaccent-edit-widget")) {
                result = true;
                break;
            }
            if(item.tagName == "CHARTACCENT-POPOUT") {
                result = true;
                break;
            }
            item = item.parentNode;
        }
        return result;
    }

    if(!annotation) {
        d3.select(window).on("mouseup.selection-box-remove", null);
        d3.select(window).on("keydown.chartaccent-selection", null);
    } else {
        d3.select(window).on("mousedown.selection-box-remove", function() {
            if(!is_event_target_in_panel_or_editing_widget(d3.event.target)) {
                if(!(d3.event.shiftKey || d3.event.ctrlKey)) {
                    self.setEditingAnnotation(null);
                    d3.select(window).on("mouseup.selection-box-remove", null);
                }
            }
        });
        d3.select(window).on("keydown.chartaccent-selection", function() {
            var is_in_wrapper = is_event_target_in_panel_or_editing_widget(d3.event.target);
            if(!is_in_wrapper && (d3.event.keyCode == 8 || d3.event.keyCode == 46)) {
                self.removeAnnotation(annotation);
                d3.event.stopPropagation();
                d3.event.preventDefault();
            }
            if(!is_in_wrapper && d3.event.keyCode == 27) {
                self.setEditingAnnotation(null);
                d3.select(window).on("keydown.chartaccent-selection", null);
            }
            if(!is_in_wrapper) {
                if(d3.event.ctrlKey && d3.event.keyCode == 'U'.charCodeAt(0)) {
                    // De-select.
                    annotation.components.forEach(function(c) {
                        if(c.type == "highlight" || c.type == "highlight-line") {
                            c.style.fill = {
                                mode: "brighter-darker",
                                value: 0.8
                            }
                            c.style.stroke = null;
                            c.style.line_stroke = {
                                mode: "brighter-darker",
                                value: 0.8
                            }
                        } else {
                            c.visible = false;
                        }
                    });
                    DM.invalidate(annotation);
                    DM.validate(self.rendered_annotations);
                }
            }
        });
    }
    d3.select(window).on("keydown.chartaccent-select-all", function() {
        var is_in_wrapper = is_event_target_in_panel_or_editing_widget(d3.event.target);
        if(!is_in_wrapper && d3.event.keyCode == "A".charCodeAt(0) && d3.event.ctrlKey) {
            var target_items = [];
            self.chart_elements.forEach(function(elements) {
                if(elements.selectAll) {
                    var selection = elements.selectAll();
                    if(selection) target_items.push(selection);
                };
            });
            if(target_items.length > 0) {
                if(self.addItemsToCurrentAnnotation(target_items)) {
                    return;
                }
                var bubbleset_enabled = target_items.every(function(d) {
                    return d.elements.bubbleset !== undefined;
                });
                var bubbleset_on = bubbleset_enabled && target_items.some(function(d) {
                    return d.elements.bubbleset == "default-on";
                });
                var components = [
                    {
                        type: self.default_lasso_label,
                        text: self.default_lasso_label == "label" ? Expression.parse('"Group"') : Expression.parse(self.default_lasso_label_expression ? self.default_lasso_label_expression : "value"),
                        anchor: "m,tt",
                        style: Styles.createDefault(self.default_lasso_label),
                        visible: false
                    },
                    {
                        type: "highlight",
                        style: Styles.createDefault("highlight-all")
                    }
                ];
                if(bubbleset_enabled) {
                    components.push({
                        visible: false,
                        type: "bubbleset",
                        style: Styles.createDefault("bubbleset")
                    });
                }
                var new_annotation = new Annotation({
                    target: {
                        type: "items",
                        items: target_items
                    },
                    components: components
                });
                self.addAnnotationIfFoundSelect(new_annotation);
            }
        }
        if(!is_in_wrapper) {
            if(d3.event.ctrlKey && d3.event.keyCode == 'Z'.charCodeAt(0)) {
                self.undo();
            }
            if(d3.event.ctrlKey && d3.event.keyCode == 'Y'.charCodeAt(0)) {
                self.redo();
            }
        }
    });
};

ChartRepresentation.prototype.getAnnotationPosition = function(annotation) {
    return this.annotations.indexOf(annotation);
};
ChartRepresentation.prototype.addItemsToCurrentAnnotation = function(items) {
    var self = this;
    if(this.editing_annotation) {
        var target = this.editing_annotation.target;
        if(target.items) {
            items.forEach(function(item) {
                var elements = item.elements;
                var eitems = item.items;
                for(var i = 0; i < target.items.length; i++) {
                    if(target.items[i].elements == elements) {
                        eitems.forEach(function(item) {
                            if(target.items[i].items.indexOf(item) < 0) {
                                target.items[i].items.push(item);
                            }
                        });
                        return;
                    }
                }
                target.items.push({
                    elements: elements,
                    items: eitems.slice()
                });
            });
            self.editing_annotation.components.forEach(function(c) {
                if(c.type == "bubbleset") {
                    c.style.fill = new RGBColor(192, 192, 192, 1);
                }
            });
            DM.invalidate(this.editing_annotation);
            DM.validate(this.rendered_annotations);
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};
ChartRepresentation.prototype.addAnnotationIfFoundSelect = function(annotation) {
    var existing_annotation = null;
    for(var i = 0; i < this.annotations.length; i++) {
        if(this.annotations[i].target_inherit) continue;
        if(deepEquals(this.annotations[i].target, annotation.target)) {
            existing_annotation = this.annotations[i];
        }
    }
    if(existing_annotation) {
        this.setEditingAnnotation(existing_annotation);
    } else {
        this.addAnnotation(annotation);
    }
};
ChartRepresentation.prototype.addAnnotation = function(annotation, position) {
    if(position === undefined) {
        this.annotations.push(annotation);
    } else {
        this.annotations.splice(position, 0, annotation);
    }

    if(this._current_annotation_id === undefined) this._current_annotation_id = 1;
    else this._current_annotation_id += 1;
    annotation.id = "#A" + this._current_annotation_id;
    this.annotations_idmap.set(annotation.id, annotation);

    DM.add(this.rendered_annotations, annotation);
    DM.invalidate(this.rendered_annotations);
    DM.validate(this.rendered_annotations);

    this.setEditingAnnotation(annotation);
};
ChartRepresentation.prototype.getAnnotationByID = function(id) {
    return this.annotations_idmap.get(id);
};
ChartRepresentation.prototype.removeAnnotation = function(annotation) {
    var idx = this.annotations.indexOf(annotation);
    if(idx >= 0) {
        this.annotations_idmap.delete(annotation.id, annotation);
        DM.remove(this.rendered_annotations, annotation);
        this.annotations.splice(idx, 1);
        DM.invalidate(this.rendered_annotations);
    }
    if(this.editing_annotation == annotation) {
        this.setEditingAnnotation(null);
    }
    DM.validate(this.rendered_annotations);
};

ChartRepresentation.prototype.addAxis = function(info) {
    var axis = ChartElements.Create(this, "axis", info);
    axis.setChart(this);
    if(info.axis == "x") {
        axis.setMode("x");
        axis.setOrigin(info.origin_y);
        this.axis_x = axis;
    }
    if(info.axis == "y") {
        axis.setMode("y");
        axis.setOrigin(info.origin_x);
        this.axis_y = axis;
    }
    this.chart_elements.push(axis);
};

ChartRepresentation.prototype.addSeriesFromD3Selection = function(info) {
    var self = this;
    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();

    if(!info.selection.node()) return; // selection is empty.

    var content = ChartElements.Create(this, "series", info);

    var elements = [];
    var data = [];
    var points = null;

    info.selection.each(function(d) {
        var tag = this.tagName;
        if(tag == "rect") {
            var matrix = this.getScreenCTM();
            matrix = root_matrix_inverse.multiply(matrix);
            var x = parseFloat(this.getAttribute("x"));
            var y = parseFloat(this.getAttribute("y"));
            var w = parseFloat(this.getAttribute("width"));
            var h = parseFloat(this.getAttribute("height"));
            var p00 = self.CreateSVGPoint(x, y).matrixTransform(matrix);
            var p01 = self.CreateSVGPoint(x, y + h).matrixTransform(matrix);
            var p10 = self.CreateSVGPoint(x + w, y).matrixTransform(matrix);
            var p11 = self.CreateSVGPoint(x + w, y + h).matrixTransform(matrix);
            var color = new RGBColor(this.style.fill);
            data.push(d);
            elements.push(["rect", p00, p01, p10, p11, color]);
        }
        if(tag == "circle") {
            var matrix = this.getScreenCTM();
            matrix = root_matrix_inverse.multiply(matrix);
            var cx = parseFloat(this.getAttribute("cx"));
            var cy = parseFloat(this.getAttribute("cy"));
            var r = parseFloat(this.getAttribute("r"));
            var center = self.CreateSVGPoint(cx, cy).matrixTransform(matrix);
            var radius = matrix.a * r;
            var color = new RGBColor(this.style.fill);
            data.push(d);
            elements.push(["circle", center, radius, color]);
        }
    });
    if(info.path) {
        var path_element = info.path.node();
        var matrix = path_element.getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        // For simplicity we assume the path is a polyline.
        var d = path_element.getAttribute("d");
        d = d.split(/\s*[ml]\s*/i).map(function(x) { return x.trim().split(/\s*,\s*/).map(function(y) { return parseFloat(y.trim()); }); }).filter(function(x) { return x.length == 2; });
        points = d.map(function(p) { return new Geometry.Vector(p[0], p[1]); });
    }

    content.setItems(data, elements, points);

    this.chart_elements.push(content);
};

ChartRepresentation.prototype.addLegend = function(info) {
    var self = this;
    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();

    var rects = [];
    var selections = [];
    var items = info.items.map(function(legend) {
        var matrix = legend.selection.node().getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        var bbox = legend.selection.node().getBBox();
        var margin_x = 3;
        var margin_y = 1;
        var p00 = self.CreateSVGPoint(bbox.x - margin_x, bbox.y - margin_y).matrixTransform(matrix);
        var p01 = self.CreateSVGPoint(bbox.x - margin_x, bbox.y + margin_y * 2 + bbox.height).matrixTransform(matrix);
        var p10 = self.CreateSVGPoint(bbox.x + margin_x * 2 + bbox.width, bbox.y - margin_y).matrixTransform(matrix);
        var p11 = self.CreateSVGPoint(bbox.x + margin_x * 2 + bbox.width, bbox.y + margin_y * 2 + bbox.height).matrixTransform(matrix);
        return {
            items: legend.items,
            name: legend.name,
            rect: [ p00, p01, p10, p11 ],
            color: legend.color ? new RGBColor(legend.color) : null
        };
    });
    var content = ChartElements.Create(this, "legend", info);
    content.setItems(items);
    this.chart_elements.push(content);
};

ChartRepresentation.prototype.createSVGDefs = function(layer) {
    var defs = layer.append("defs");
    // Drop shadow effect.
    var filter = defs.append("filter")
        .attr("id", "chartaccent-drop-shadow")
        .attr("height", "200%")
        .attr("width", "200%");
    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 1);
    filter.append("feOffset")
        .attr("dx", 0)
        .attr("dy", 2);
    filter.append("feComponentTransfer")
        .append("feFuncA")
            .attr("type", "linear")
            .attr("slope", 0.2)
    var feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode");
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");
};

ChartRepresentation.prototype.emptyState = function() {
    return {
        annotations: []
    };
};

ChartRepresentation.prototype.saveState = function() {
    var state = {
        annotations: CloneAnnotations(this.annotations)
    };
    return state;
};

ChartRepresentation.prototype.loadState = function(state) {
    this._should_ignore_undo_log = true;
    this.layers.cleanup();

    for(var i = 0; i < this.annotations.length; i++) {
        DM.remove(this.rendered_annotations, this.annotations[i]);
    }

    this.annotations = state.annotations.slice();
    this.annotations_idmap = new Map();

    for(var i = 0; i < this.annotations.length; i++) {
        DM.add(this.rendered_annotations, this.annotations[i]);
        DM.invalidate(this.annotations[i]);
        this.annotations_idmap.set(this.annotations[i].id, this.annotations[i]);
    }

    this.editing_annotation = null;

    DM.invalidate(this.rendered_annotations);
    DM.validate(this.rendered_annotations);
    this._should_ignore_undo_log = false;
};

ChartRepresentation.prototype.saveStateForUndo = function() {
    if(this._should_ignore_undo_log) return;
    var current_time = new Date().getTime() / 1000.0;
    var action = {
        timestamp: current_time,
        state: this.saveState()
    }
    // Action grouping.
    if(this.undo_history.length > 0 && this.undo_history[this.undo_history.length - 1].timestamp > current_time - 0.1) {
        this.undo_history[this.undo_history.length - 1] = action;
    } else {
        this.undo_history.push(action);
    }
    this.redo_history = [];
};

ChartRepresentation.prototype.undo = function() {
    if(this.undo_history.length > 0) {
        var action = this.undo_history.splice(this.undo_history.length - 1, 1)[0];
        var previous_state = this.emptyState();
        if(this.undo_history.length > 0) {
            previous_state = this.undo_history[this.undo_history.length - 1].state;
        }
        this.loadState(previous_state);
        this.redo_history.push(action);
    }
};

ChartRepresentation.prototype.reset = function() {
    this.setEditingAnnotation(null);
    this.annotations = [];
    DM.invalidate(this.rendered_annotations);
    DM.validate(this.rendered_annotations);
};

ChartRepresentation.prototype.redo = function() {
    if(this.redo_history.length > 0) {
        var action = this.redo_history.splice(this.redo_history.length - 1, 1)[0];
        this.loadState(action.state);
        this.undo_history.push(action);
    }
};

ChartRepresentation.Create = function(owner, info) {
    return new ChartRepresentation(owner, info);
};




var ChartAccent = function(info) {
    this.charts = [];

    this.layer_annotation = resolveToSVGSelection(info.layer_annotation);
    this.layer_background = resolveToSVGSelection(info.layer_background);
    this.panel = info.panel;
    // Find the SVG node containing layer_annotation
    var svg = this.layer_annotation.node();
    while(svg.tagName != "svg") {
        svg = svg.parentNode;
    }
    this.svg = svg;
};

ChartAccent.prototype.AddChart = function(info) {
    var repr = ChartRepresentation.Create(this, info);
    this.charts.push(repr);
    return repr;
};
ChartAccent.prototype.getSVGDataBlob = function() {
    var s = new XMLSerializer();
    var str = s.serializeToString(this.svg);
    var additional_css = ".chartaccent-edit-widget { visibility: hidden; }";
    var p_insert = str.indexOf(">") + 1;
    str = str.slice(0, p_insert) + '<defs><style type="text/css"><![CDATA[' + additional_css + ']]></style></defs>' + str.slice(p_insert);
    // create a file blob of our SVG.
    var doctype = '<?xml version="1.0" standalone="no"?>'
                + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
    var blob = new Blob([ doctype + str], { type: 'image/svg+xml;charset=utf-8' });
    return blob;
};

ChartAccent.prototype.getSVGDataURL = function() {
    var blob = this.getSVGDataBlob();
    var url = window.URL.createObjectURL(blob);
    return url;
};

ChartAccent.prototype.getImageDataURL = function(format, scale, callback) {
    var img = new Image();
    img.onload = function() {
        // Now that the image has loaded, put the image into a canvas element.
        var canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFF";
        ctx.scale(scale, scale);
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        var canvasUrl = canvas.toDataURL(format);
        callback(canvasUrl);
    };
    img.src = this.getSVGDataURL();
};

ChartAccent.prototype.getImageDataBlob = function(format, scale, callback) {
    var img = new Image();
    img.onload = function() {
        // Now that the image has loaded, put the image into a canvas element.
        var canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFF";
        ctx.scale(scale, scale);
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function(blob) {
            callback(blob);
        }, format);
    };
    img.src = this.getSVGDataURL();
};

Module.Create = function(info) {
    return new ChartAccent(info);
};


    return Module;
})());

if(typeof(exports) !== "undefined") {
    exports.ChartAccent = ChartAccent;
}
