// The field notebook: one page for each idea, opened by finishing the level that teaches it.
// Every page: a name, a few plain sentences, who worked the idea out and when (checked against a reliable source), and a small drawing (js/ui/draw.js).
export const CARDS = {
  loss: { name: 'Loss', draw: 'loss',
    text: ['A machine that is learning keeps one number that says how wrong it is. That number is called the loss.', 'In this game the loss is height. The higher Theta stands, the worse the guess. Every level ends on the lowest ground there is.'] },
  gradient: { name: 'Gradient', draw: 'gradient',
    text: ['The gradient is the slope under your feet. It tells you two things at once: which way is down, and how steep it is.', 'Theta cannot see the whole valley from here, and does not need to. The ground underfoot is enough to choose the next step.'] },
  rate: { name: 'Learning rate', draw: 'rate',
    text: ['How far to go on each step is a choice, and it has a name: the learning rate.', 'Short steps are safe and slow. Long steps cover ground, as long as there is room to land.', 'Eta, the firefly, is named for the Greek letter η, which is how the learning rate is usually written.'] },
  overshoot: { name: 'Overshoot', draw: 'overshoot',
    text: ['Take too long a step into a narrow valley and you land on the far wall, higher than where you started.', 'Do it again and you can climb right out. When the learning rate is too high, the loss goes up when it should go down.'] },
  descent: { name: 'Gradient descent', draw: 'descent', who: 'Augustin-Louis Cauchy, 1847',
    text: ['Look at the slope. Take a step downhill. Look again.', 'That is the whole method, and it is called gradient descent. Augustin-Louis Cauchy, a French mathematician, described it in 1847. Most machines that learn today are still trained this way.'],
    math: 'θ ← θ − η ∇L(θ)', key: 'θ is where you stand, η is the length of the step, and ∇L(θ) is the slope there.' },
};
export const HINTS = {
  move: { key: 'Press → or D to run.', touch: 'Slide your left thumb to run.', pad: 'Push the stick to run.' },
  jump: { key: 'Space jumps. Tap for a hop, hold for a leap.', touch: 'The upper button jumps. Tap for a hop, hold for a leap.', pad: 'A jumps. Tap for a hop, hold for a leap.' },
  slide: { key: 'On ice and snow, hold Shift to slide.', touch: 'On ice and snow, hold the lower button to slide.', pad: 'On ice and snow, hold B to slide.' },
  jet: { key: 'Stand in the geyser and let it carry you up.', touch: 'Stand in the geyser and let it carry you up.', pad: 'Stand in the geyser and let it carry you up.' },
};
