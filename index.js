class Utils {
    static hitTestRectangle(r1, r2) {
        //Define the variables we'll need to calculate
        let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
      
        //hit will determine whether there's a collision
        hit = false;
      
        //Find the center points of each sprite
        r1.centerX = r1.x + r1.width / 2;
        r1.centerY = r1.y + r1.height / 2;
        r2.centerX = r2.x + r2.width / 2;
        r2.centerY = r2.y + r2.height / 2;
      
        //Find the half-widths and half-heights of each sprite
        r1.halfWidth = r1.width / 2;
        r1.halfHeight = r1.height / 2;
        r2.halfWidth = r2.width / 2;
        r2.halfHeight = r2.height / 2;
      
        //Calculate the distance vector between the sprites
        vx = r1.centerX - r2.centerX;
        vy = r1.centerY - r2.centerY;
      
        //Figure out the combined half-widths and half-heights
        combinedHalfWidths = r1.halfWidth + r2.halfWidth;
        combinedHalfHeights = r1.halfHeight + r2.halfHeight;
      
        //Check for a collision on the x axis
        if (Math.abs(vx) < combinedHalfWidths) {
      
          //A collision might be occurring. Check for a collision on the y axis
          if (Math.abs(vy) < combinedHalfHeights) {
      
            //There's definitely a collision happening
            hit = true;
          } else {
      
            //There's no collision on the y axis
            hit = false;
          }
        } else {
      
          //There's no collision on the x axis
          hit = false;
        }
      
        //`hit` will be either `true` or `false`
        return hit;
    }
}

class Game {
    static create(options) {
        const game = new Game(options)

        game.init()
        game.start()

        return game
    }

    constructor(options) {
        this.options = options

        this.stage = 'init'
        /*
        init -> menu
        menu -> settings
        setting -> menu
        menu -> game
        game -> settings_light
        settings_light -> game
        game -> over
        over -> menu
        over -> game
        */

        this.app = null
        this.cage = null
        this.ship = null
        this.score = null
        this.bullet = null
        this.fire = false
    }

    init() {
        this.makeApp()
        this.makeCage()
        this.makeShip()
        this.makeBullet()
        this.makeUI()
    }

    makeApp() {
        this.app = new PIXI.Application({
            width: 800, height: 600, backgroundColor: 0x1099bb, resolution: window.devicePixelRatio || 1,
        });
        document.body.appendChild(this.app.view);
    }

    makeCage() {
        // Клетка с зайцами

        this.cage = new PIXI.Container();
        
        this.app.stage.addChild(this.cage);
        
        // Create a new texture
        // @todo to init()
        const texture = PIXI.Texture.from('assets/bunny.png');
        
        // Create a 5x5 grid of bunnies
        for (let i = 0; i < this.options.bunniesCount; i++) {
            const bunny = new PIXI.Sprite(texture);
            bunny.anchor.set(0.5);
            bunny.x = (i % 5) * 40;
            bunny.y = Math.floor(i / 5) * 40;

            this.app.ticker.add(() => {
                const bunnyCoords = {
                    ...bunny.getGlobalPosition(),
                    width: bunny.width,
                    height: bunny.height
                }

                if(this.bullet.visible && Utils.hitTestRectangle(bunnyCoords, this.bullet)) {
                    this.cage.removeChild(bunny)
                    this.bullet.visible = false
                    this.incrementScore(5)

                    if(this.cage.children.length == 0) {
                        // GAME OVER
                        this.gameOver()
                    }
                }
            })

            this.cage.addChild(bunny);
        }
      
        // // Center bunny sprite in local this.cage coordinates
        this.cage.pivot.x = this.cage.width / 2;
        this.cage.pivot.y = this.cage.height / 2;

        // Move this.cage to the center
        this.cage.x = this.app.screen.width / 2;
        this.cage.y = this.app.screen.height / 4;
    }

    gameOver() {
        this.app.ticker.stop()

        this.ship.visible = false
        this.cage.visible = false
        this.score.visible = false

        let text = new PIXI.Text(`Game Over! Your score is ${this.score.text}`, {fontFamily : 'Arial', fontSize: 24, fill : 0xff1010, align : 'center'});
        text.anchor.set(0.5)
        text.position.x = this.app.screen.width / 2
        text.position.y = this.app.screen.height / 2
        
        this.app.stage.addChild(text);
    }

    makeShip() {
        const texture = PIXI.Texture.from('assets/ship.png');

        this.ship = new PIXI.Sprite(texture)
        
        this.ship.x = this.app.screen.width / 2
        this.ship.y = this.app.screen.height * 7/8
       
        this.ship.anchor.set(0.5)
        this.ship.scale.set(0.5)

        this.app.stage.addChild(this.ship);

        this.app.stage.interactive = true
        this.app.stage.on('mousemove', e => {
            const x = e.data.getLocalPosition(this.app.stage).x
            this.moveShip(x)
        })

        document.addEventListener('mousedown', () => {
            this.fire = true
        })
        document.addEventListener('mouseup', e => {
            this.fire = false
        })
    }

    makeBullet() {
        const texture = PIXI.Texture.from('assets/bullet.png');

        this.bullet = new PIXI.Sprite(texture)
        
        this.bullet.x = this.app.screen.width / 2
        this.bullet.y = this.app.screen.height * 7/8
       
        this.bullet.anchor.set(0.5)
        this.bullet.scale.set(0.5)

        this.bullet.visible = false

        this.app.stage.addChild(this.bullet);

        this.app.ticker.add(() => {
            if(this.bullet.visible === false) {
                if(this.fire === true) {
                    this.bullet.visible = true
                    this.bullet.x = this.ship.x
                    this.bullet.y = this.app.screen.height * 7/8
                }
            } else {
                this.bullet.y -= this.options.bulletSpeed

                if(this.bullet.y < 0) {
                    this.bullet.visible = false
                    this.incrementScore(-1)
                }
            }
        })
    }

    makeUI() {
        this.score = new PIXI.Text('0');
        this.score.position.set(20)
        
        this.app.stage.addChild(this.score);
    }

    incrementScore(v = 1) {
        this.score.text = +this.score.text + v
    }

    moveShip(x) {
        this.ship.x = Math.min(Math.max(x, 0), this.app.screen.width)
    }

    start() {
        // Listen for animate update
        this.app.ticker.add(() => {
            // rotate the this.cage!
            // use delta to create frame-independent transform
            this.cage.rotation += Math.PI * 2 / (60 * this.options.cageFullRotationTime);
            this.cage.children.forEach(v => v.rotation -= Math.PI * 2 / (60 * this.options.cageFullRotationTime))
        });
    }
}
