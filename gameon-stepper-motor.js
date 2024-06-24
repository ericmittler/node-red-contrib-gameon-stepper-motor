const { StepperMotorConfig, StepperMotorMovement } = require('./StepperMotor')

module.exports = RED => {
  function StepperMotorConfigNode(config) {
    const node = this
    RED.nodes.createNode(node, config)
    this.stepperMotor = new StepperMotorConfig({ RED, node, ...config })
  }
  RED.nodes.registerType('gameon-stepper-motor', StepperMotorConfigNode)

  function StepperMotorMovementNode(config) {
    const node = this
    RED.nodes.createNode(node, config)
    this.stepperMotorMovement = new StepperMotorMovement({ RED, node, ...config })
  }
  RED.nodes.registerType('gameon-stepper-motor-movement', StepperMotorMovementNode)
}