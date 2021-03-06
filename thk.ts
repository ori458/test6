/**
 * Blocks for driving the Kitronik I2C 16-Servo Driver Board
 */
//% weight=150 color=#de3b09 icon="\uf085" block="THK"

namespace THK {

    //Some useful parameters. 
    let ChipAddress = 0x6A //default Kitronik Chip address
    let PrescaleReg = 0xFE //the prescale register address
    let Mode1Reg = 0x00  //The mode 1 register address

    // If you wanted to write some code that stepped through the servos then this is the BASe and size to do that 	
    let Servo1RegBase = 0x08
    let ServoRegDistance = 4
    //To get the PWM pulses to the correct size and zero offset these are the default numbers. 
    let ServoMultiplier = 226
    let ServoZeroOffset = 0x66

    let initalised = false //a flag to allow us to initialise without explicitly calling the secret incantation
    let keisuu_setting = 80

    //nice big list of servos for the block to use. These represent register offsets in the PCA9865
    export enum Servos {
        SV1 = 0x08,
        SV2 = 0x0C,
        SV3 = 0x10,
        SV4 = 0x14,
        SV5 = 0x18,
        SV6 = 0x1C,
        SV7 = 0x20,
        SV8 = 0x24,
        SV9 = 0x28,
        SV10 = 0x2C,
        SV11 = 0x30,
        SV12 = 0x34,
        SV13 = 0x38,
        SV14 = 0x3C,
        SV15 = 0x40,
        SV16 = 0x44,
    }

    export enum BoardAddresses {
        Board1 = 0x6A,

    }
    //Trim the servo pulses. These are here for advanced users, and not exposed to blocks.
    //It appears that servos I've tested are actually expecting 0.5 - 2.5mS pulses, 
    //not the widely reported 1-2mS 
    //that equates to multiplier of 226, and offset of 0x66
    // a better trim function that does the maths for the end user could be exposed, the basics are here 
    // for reference

    export function TrimServoMultiplier(Value: number) {
        if (Value < 113) {
            ServoMultiplier = 113
        }
        else {
            if (Value > 226) {
                ServoMultiplier = 226
            }
            else {
                ServoMultiplier = Value
            }

        }
    }
    export function TrimServoZeroOffset(Value: number) {
        if (Value < 0x66) {
            ServoZeroOffset = 0x66
        }
        else {
            if (Value > 0xCC) {
                ServoZeroOffset = 0xCC
            }
            else {
                ServoZeroOffset = Value
            }

        }
    }

    /*
        This secret incantation sets up the PCA9865 I2C driver chip to be running at 50Hx pulse repetition, and then sets the 16 output registers to 1.5mS - centre travel.
        It should not need to be called directly be a user - the first servo write will call it.
	
    */
    function secretIncantation(): void {
        let buf = pins.createBuffer(2)

        //Should probably do a soft reset of the I2C chip here when I figure out how

        // First set the prescaler to 50 hz
        buf[0] = PrescaleReg
        buf[1] = 0x85
        pins.i2cWriteBuffer(ChipAddress, buf, false)
        //Block write via the all leds register to set all of them to 90 degrees
        buf[0] = 0xFA
        buf[1] = 0x00
        pins.i2cWriteBuffer(ChipAddress, buf, false)
        buf[0] = 0xFB
        buf[1] = 0x00
        pins.i2cWriteBuffer(ChipAddress, buf, false)
        buf[0] = 0xFC
        buf[1] = 0x66
        pins.i2cWriteBuffer(ChipAddress, buf, false)
        buf[0] = 0xFD
        buf[1] = 0x00
        pins.i2cWriteBuffer(ChipAddress, buf, false)
        //Set the mode 1 register to come out of sleep
        buf[0] = Mode1Reg
        buf[1] = 0x01
        pins.i2cWriteBuffer(ChipAddress, buf, false)
        //set the initalised flag so we dont come in here again automatically
        initalised = true
    }

    //% blockId=keisuu
    //% block="???????????????????????????????????? %keisuu"
    //% keisuu=80
    /**
 * TODO: describe your function here
 * @param keisuu describe parameter here, eg: 80
 */
    export function KeisuuSetting(keisuu: number): void {
        keisuu_setting = keisuu
    }

    /**
         * sets the requested servo to the reguested angle.
         * if the PCA has not yet been initialised calls the initialisation routine

         */


    //% help=basic/pause weight=54
    //% async block="pause (ms) %pause" blockGap=16
    //% blockId=device_pause icon="\uf110"
    //% pause.shadow=timePicker

    export function pause(ms: number): void {
        basic.pause(ms);
    }
    
    //% blockId=Kitronik_servo
    //% block="????????? %Servo|??? %degrees|????????????"
    //% degrees.min=-90 degrees.max=90
    /**
 * TODO: describe your function here
 * @param degrees describe parameter here, eg: 90
 */
    export function ??????????????????(Servo: Servos, degrees: number): void {
        if (initalised == false) {
            secretIncantation()
        }
        if (degrees < 1) {
            degrees = 1
        }
        let buf = pins.createBuffer(2)
        let HighByte = false
        let deg100 = degrees * keisuu_setting //??????100
        let PWMVal100 = deg100 * ServoMultiplier
        let PWMVal = PWMVal100 / 10000

        PWMVal = Math.floor(PWMVal)
        PWMVal = PWMVal + ServoZeroOffset
        if (PWMVal > 0xFF) {
            HighByte = true
        }
        buf[0] = Servo
        buf[1] = PWMVal
        pins.i2cWriteBuffer(ChipAddress, buf, false)
        if (HighByte) {
            buf[0] = Servo + 1
            buf[1] = 0x01
        }
        else {
            buf[0] = Servo + 1
            buf[1] = 0x00
        }
        pins.i2cWriteBuffer(ChipAddress, buf, false)
    }
    

}