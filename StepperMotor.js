const MotorHat = require('motor-hat')

const VERSION = '1.0'

class StepperMotorConfig {
  constructor({ node, name, address, stepperIndex = 0 }) {
    this.node = node
    const xlessAddress = address.replace(/^0X/i, '')
    this.address = parseInt(xlessAddress, 16)
    this.name = name
    this.stepperIndex = stepperIndex
    const options = {
      address: this.address,
      steppers: [{ W1: 'M1', W2: 'M2' }, { W1: 'M3', W2: 'M4' }],
    }
    this.motorHat = MotorHat(options).init()
    this.motor = this.motorHat.steppers[stepperIndex]
    this.node.log(`StepperMotorConfig (V${VERSION}): ${name} (index ${stepperIndex} @ ${address})`)
  }

  label() {
    return `${this.name} (0X${this.address.toString(16)} index ${this.stepperIndex})`
  }
}

class StepperMotorMovement {
  constructor({ RED, name, motorNodeID, node, direction, steps, pps }) {
    this.node = node
    this.name = name
    this.direction = direction
    this.steps = steps
    this.pps = pps
    this.motorNodeID = motorNodeID
    this.motorNode = RED.nodes.getNode(this.motorNodeID)
    this.motor = this.motorNode.stepperMotor.motor
    this.node.status({
      fill: 'black', shape: 'square',
      text: `Motor ${this.motorNode.name} idle`
    })
    this.node.on('input', (msg, send, done) => {
      this.node.log(`Stepper Motor Movement input`)
      this.input({ msg, send, done })
    })
  }

  input({ msg, send, done }) {
    this.node.log(`Stepper Motor Movement`)
    const steps = parseInt(msg.steps) || this.steps
    let direction = msg.direction || this.direction
    if (['forward', 'forwards'].includes(direction)) { direction = 'fwd' }
    if (['backward', 'backwards', 'bk'].includes(direction)) { direction = 'back' }
    if (!['fwd', 'back'].includes(direction)) { direction = 'fwd' }
    const pps = parseInt(msg.pps || this.pps)
    const text = `Motor ${this.motorNode.name} Stepping ${steps} ${direction} @ ${pps} PPS`
    this.node.status({ fill: 'green', shape: 'dot', text })
    this.node.log(text)
    this.motor.setSpeed({ pps })
    this.motor.step(direction, steps, (error, result) => {
      try {
        if (error) {
          this.node.status({
            fill: 'red', shape: 'square',
            text: `ERROR on Motor ${this.motorNode.name} Stepping ${steps} ${direction} @ ${pps} PPS`
          })
          send({ error })
          done(error)
        } else {
          const durationSec = result.duration / 1000
          const stepped = result.steps
          const retried = result.retried
          const text = `Stepped ${result.dir} ${stepped} in ${durationSec.toFixed(2)} sec`
          this.node.status({ fill: 'blue', shape: 'dot', text })
          this.node.log(text)
          this.motor.release(error => {
            if (error) {
              this.node.status({
                fill: 'red', shape: 'square',
                text: `ERROR Releasing Motor ${this.motorNode.name}`
              })
            }
          })
          send({
            ...msg, steps, direction, stepped, durationSec, retried
          })
          done()
        }
      } catch (error) {
        done(error)
      }
    })
  }
}


module.exports = { StepperMotorConfig, StepperMotorMovement }