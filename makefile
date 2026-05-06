PROJECT=Jellyfin.Plugin.AllowMovieShow/Jellyfin.Plugin.AllowMovieShow.csproj

build:
	dotnet build $(PROJECT)

publish:
	dotnet publish $(PROJECT) -c Release -o ./dist

clean:
	dotnet clean $(PROJECT)

dev: build
