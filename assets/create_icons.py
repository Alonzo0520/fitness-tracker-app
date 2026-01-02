from PIL import Image, ImageDraw, ImageFont

# Create icon.png (1024x1024)
icon = Image.new('RGB', (1024, 1024), color='#4CAF50')
draw = ImageDraw.Draw(icon)

# Draw a simple dumbbell icon
# Left weight
draw.ellipse([100, 400, 300, 624], fill='white')
# Right weight  
draw.ellipse([724, 400, 924, 624], fill='white')
# Bar
draw.rectangle([300, 480, 724, 544], fill='white')

icon.save('icon.png')

# Create adaptive-icon.png (same)
icon.save('adaptive-icon.png')

# Create splash.png (1284x2778)
splash = Image.new('RGB', (1284, 2778), color='#4CAF50')
draw_splash = ImageDraw.Draw(splash)

# Draw dumbbell in center
# Left weight
draw_splash.ellipse([342, 1139, 542, 1639], fill='white')
# Right weight
draw_splash.ellipse([742, 1139, 942, 1639], fill='white')
# Bar
draw_splash.rectangle([542, 1289, 742, 1489], fill='white')

splash.save('splash.png')

# Create favicon.png (48x48)
favicon = icon.resize((48, 48), Image.Resampling.LANCZOS)
favicon.save('favicon.png')

print("All icons created successfully!")
